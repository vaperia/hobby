const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { bucket } = require("../lib/firebaseAdmin");
const { getDownloadURL } = require("firebase-admin/storage");

const router = express.Router();

const ACTIVE = "ACTIVE";
const AWAITING_PAYMENT = "AWAITING_PAYMENT";
const PAID = "PAID";
const CANCELLED = "CANCELLED";
const EXPIRED_UNPAID = "EXPIRED_UNPAID";

function getPaymentDueDate() {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);
  return dueDate;
}

function getRepostEndDate() {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);
  return endDate;
}

function isPaymentOverdue(auction) {
  return (
    auction.status === AWAITING_PAYMENT &&
    auction.paymentDueAt &&
    new Date(auction.paymentDueAt) < new Date()
  );
}

async function uploadImageToFirebase(file) {
  if (!file) return null;

  const fileName = `auctions/${Date.now()}-${file.originalname.replace(
    /\s+/g,
    "-"
  )}`;

  const firebaseFile = bucket.file(fileName);

  await firebaseFile.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
  });

  return getDownloadURL(firebaseFile);
}

function extractFirebaseFilePath(imageUrl) {
  if (!imageUrl) return null;

  try {
    if (imageUrl.startsWith("gs://")) {
      const withoutPrefix = imageUrl.replace("gs://", "");
      const parts = withoutPrefix.split("/");
      parts.shift();
      return parts.join("/");
    }

    if (imageUrl.includes("/o/")) {
      const encodedPath = imageUrl.split("/o/")[1].split("?")[0];
      return decodeURIComponent(encodedPath);
    }

    if (imageUrl.startsWith("auctions/")) {
      return imageUrl;
    }

    return null;
  } catch (error) {
    console.error("Extract Firebase path error:", error);
    return null;
  }
}

async function deleteImageFromFirebase(imageUrl) {
  if (!imageUrl) return;

  try {
    const filePath = extractFirebaseFilePath(imageUrl);

    if (!filePath) {
      console.warn("Could not extract Firebase file path from URL:", imageUrl);
      return;
    }

    await bucket.file(filePath).delete();

    console.log("Deleted Firebase image:", filePath);
  } catch (error) {
    if (error.code === 404) {
      console.warn("Firebase image already deleted or not found.");
      return;
    }

    console.error("Delete Firebase image error:", error);
  }
}

function getUniqueHighestBids(bids = []) {
  const unique = [];

  for (const bid of bids) {
    const alreadyAdded = unique.some((item) => item.bidderId === bid.bidderId);

    if (!alreadyAdded) {
      unique.push(bid);
    }
  }

  return unique;
}

async function getAuctionWithDetails(id) {
  return prisma.auction.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      winner: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      bids: {
        include: {
          bidder: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
      },
    },
  });
}

async function getCompletedOrderItemForAuction(auctionId) {
  return prisma.orderItem.findFirst({
    where: {
      auctionId,
      deliveryStatus: {
        in: ["completed", "collected"],
      },
    },
    select: {
      id: true,
      deliveryStatus: true,
    },
  });
}

async function forfeitAuctionIfPaymentExpired(id) {
  const auction = await getAuctionWithDetails(id);

  if (!auction) return null;

  if (!isPaymentOverdue(auction)) {
    return auction;
  }

  await prisma.$transaction(async (tx) => {
    await tx.cartItem.deleteMany({
      where: {
        auctionId: auction.id,
      },
    });

    await tx.auction.update({
      where: { id: auction.id },
      data: {
        status: EXPIRED_UNPAID,

        // Keep these values so the seller can still offer
        // the item to the next highest bidder later.
        winnerId: auction.winnerId,
        winnerRank: auction.winnerRank,
        winnerSource: auction.winnerSource,
        currentBid: auction.currentBid,
        paymentDueAt: auction.paymentDueAt,
      },
    });
  });

  return getAuctionWithDetails(id);
}

async function finalizeAuctionIfEnded(id) {
  const auction = await getAuctionWithDetails(id);

  if (!auction) return null;

  const now = new Date();

  if (auction.status !== ACTIVE || new Date(auction.endsAt) > now) {
    return auction;
  }

  if (!auction.bids.length) {
    await prisma.auction.update({
      where: { id },
      data: {
        status: EXPIRED_UNPAID,
      },
    });

    return getAuctionWithDetails(id);
  }

  const uniqueHighestBids = getUniqueHighestBids(auction.bids);
  const winnerBid = uniqueHighestBids[0];

  await prisma.$transaction(async (tx) => {
    await tx.auction.update({
      where: { id },
      data: {
        status: AWAITING_PAYMENT,
        winnerId: winnerBid.bidderId,
        winnerRank: 1,
        winnerSource: "BID",
        currentBid: winnerBid.amount,
        paymentDueAt: getPaymentDueDate(),
      },
    });

    await tx.cartItem.upsert({
      where: {
        userId_auctionId: {
          userId: winnerBid.bidderId,
          auctionId: id,
        },
      },
      update: {
        quantity: 1,
        price: Number(winnerBid.amount),
      },
      create: {
        userId: winnerBid.bidderId,
        auctionId: id,
        quantity: 1,
        price: Number(winnerBid.amount),
      },
    });
  });

  return getAuctionWithDetails(id);
}

router.get("/", async (req, res) => {
  try {
    const { category, search, status } = req.query;

    const where = {};

    if (category) {
      where.category = {
        equals: category,
        mode: "insensitive",
      };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const auctions = await prisma.auction.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        bids: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(auctions);
  } catch (error) {
    console.error("Get auctions error:", error);
    return res.status(500).json({ message: "Server error fetching auctions" });
  }
});

router.get("/seller/my-auctions", authMiddleware, async (req, res) => {
  try {
    const auctions = await prisma.auction.findMany({
      where: {
        sellerId: req.user.userId,
      },
      include: {
        winner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        bids: {
          include: {
            bidder: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const checkedAuctions = await Promise.all(
      auctions.map(async (auction) => {
        let updatedAuction = await finalizeAuctionIfEnded(auction.id);

        if (updatedAuction) {
          updatedAuction = await forfeitAuctionIfPaymentExpired(
            updatedAuction.id
          );
        }

        if (!updatedAuction) return null;

        const completedOrderItem = await getCompletedOrderItemForAuction(
          updatedAuction.id
        );

        const auctionEnded =
          updatedAuction.endsAt &&
          new Date(updatedAuction.endsAt) <= new Date();

        const endedWithoutBids =
          auctionEnded &&
          updatedAuction.status === ACTIVE &&
          (!updatedAuction.bids || updatedAuction.bids.length === 0);

        const canDeletePosting =
          updatedAuction.bids.length === 0 ||
          updatedAuction.status === EXPIRED_UNPAID ||
          endedWithoutBids ||
          isPaymentOverdue(updatedAuction) ||
          Boolean(completedOrderItem);

        return {
          ...updatedAuction,
          canDeletePosting,
          completedOrderStatus: completedOrderItem?.deliveryStatus || null,
        };
      })
    );

    return res.json(checkedAuctions.filter(Boolean));
  } catch (error) {
    console.error("Get seller auctions error:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching seller auctions" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    let auction = await finalizeAuctionIfEnded(req.params.id);

    if (auction) {
      auction = await forfeitAuctionIfPaymentExpired(req.params.id);
    }

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    return res.json(auction);
  } catch (error) {
    console.error("Get auction error:", error);
    return res.status(500).json({ message: "Server error fetching auction" });
  }
});

router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      condition,
      startingBid,
      bidIncrement,
      buyoutPrice,
      endsAt,
    } = req.body;

    if (!title || !startingBid || !endsAt) {
      return res.status(400).json({
        message: "Title, starting bid, and end date are required",
      });
    }

    const startingBidNumber = Number(startingBid);
    const bidIncrementNumber = Number(bidIncrement || 1);
    const buyoutPriceNumber =
      buyoutPrice === undefined || buyoutPrice === ""
        ? null
        : Number(buyoutPrice);

    if (startingBidNumber <= 0) {
      return res.status(400).json({ message: "Starting bid must be above 0" });
    }

    if (bidIncrementNumber <= 0) {
      return res.status(400).json({ message: "Bid increment must be above 0" });
    }

    if (buyoutPriceNumber && buyoutPriceNumber <= startingBidNumber) {
      return res.status(400).json({
        message: "Buyout price must be higher than starting bid",
      });
    }

    if (new Date(endsAt) <= new Date()) {
      return res.status(400).json({
        message: "Auction end date must be in the future",
      });
    }

    const imageUrl = await uploadImageToFirebase(req.file);

    const auction = await prisma.auction.create({
      data: {
        title,
        description,
        imageUrl,
        category,
        condition,
        startingBid: startingBidNumber,
        currentBid: null,
        bidIncrement: bidIncrementNumber,
        buyoutPrice: buyoutPriceNumber,
        endsAt: new Date(endsAt),
        status: ACTIVE,
        sellerId: req.user.userId,
      },
    });

    return res.status(201).json(auction);
  } catch (error) {
    console.error("Create auction error:", error);
    return res.status(500).json({ message: "Server error creating auction" });
  }
});

router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const auctionId = req.params.id;
    const sellerId = req.user.userId;

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: true,
      },
    });

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.sellerId !== sellerId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (auction.status === PAID || auction.status === AWAITING_PAYMENT) {
      return res.status(400).json({
        message:
          "Cannot edit an auction that is awaiting payment or already paid.",
      });
    }

    const {
      title,
      description,
      category,
      condition,
      startingBid,
      bidIncrement,
      buyoutPrice,
      endsAt,
    } = req.body;

    const hasBids = auction.bids.length > 0;
    const updateData = {};
    let oldImageUrlToDelete = null;

    if (endsAt) {
      const newEndDate = new Date(endsAt);

      if (Number.isNaN(newEndDate.getTime())) {
        return res.status(400).json({ message: "Invalid auction end date" });
      }

      if (newEndDate <= new Date()) {
        return res.status(400).json({
          message: "Auction end date must be in the future",
        });
      }

      if (hasBids && newEndDate <= new Date(auction.endsAt)) {
        return res.status(400).json({
          message:
            "After bids are placed, you can only extend the auction time.",
        });
      }

      updateData.endsAt = newEndDate;

      if (auction.status === EXPIRED_UNPAID || auction.status === CANCELLED) {
        updateData.status = ACTIVE;
        updateData.winnerId = null;
        updateData.winnerRank = 0;
        updateData.winnerSource = null;
        updateData.paymentDueAt = null;
        updateData.paidAt = null;
      }
    }

    if (buyoutPrice !== undefined) {
      const buyoutPriceNumber =
        buyoutPrice === "" || buyoutPrice === null ? null : Number(buyoutPrice);

      if (buyoutPriceNumber !== null) {
        const currentBid = auction.currentBid || auction.startingBid;

        if (buyoutPriceNumber <= currentBid) {
          return res.status(400).json({
            message: "Buyout price must be higher than the current bid.",
          });
        }
      }

      updateData.buyoutPrice = buyoutPriceNumber;
    }

    if (!hasBids) {
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (condition !== undefined) updateData.condition = condition;

      if (startingBid !== undefined) {
        const startingBidNumber = Number(startingBid);

        if (!startingBidNumber || startingBidNumber <= 0) {
          return res.status(400).json({
            message: "Starting bid must be above 0",
          });
        }

        updateData.startingBid = startingBidNumber;
      }

      if (bidIncrement !== undefined) {
        const bidIncrementNumber = Number(bidIncrement);

        if (!bidIncrementNumber || bidIncrementNumber <= 0) {
          return res.status(400).json({
            message: "Bid increment must be above 0",
          });
        }

        updateData.bidIncrement = bidIncrementNumber;
      }

      if (req.file) {
        oldImageUrlToDelete = auction.imageUrl;
        updateData.imageUrl = await uploadImageToFirebase(req.file);
      }
    }

    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
      data: updateData,
      include: {
        bids: true,
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (oldImageUrlToDelete && oldImageUrlToDelete !== updatedAuction.imageUrl) {
      await deleteImageFromFirebase(oldImageUrlToDelete);
    }

    return res.json({
      message: hasBids
        ? "Auction timing/buyout updated successfully."
        : "Auction updated successfully.",
      auction: updatedAuction,
    });
  } catch (error) {
    console.error("Update auction error:", error);
    return res.status(500).json({
      message: "Server error updating auction",
    });
  }
});

router.post("/:id/bids", authMiddleware, async (req, res) => {
  try {
    const { amountToAdd } = req.body;
    const auctionId = req.params.id;
    const bidderId = req.user.userId;

    const auction = await getAuctionWithDetails(auctionId);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.status !== ACTIVE) {
      return res.status(400).json({ message: "Auction is not active" });
    }

    if (new Date(auction.endsAt) <= new Date()) {
      await finalizeAuctionIfEnded(auctionId);
      return res.status(400).json({ message: "Auction has ended" });
    }

    if (auction.sellerId === bidderId) {
      return res.status(400).json({
        message: "You cannot bid on your own auction",
      });
    }

    const highestBid = auction.bids[0];

    if (highestBid && highestBid.bidderId === bidderId) {
      return res.status(400).json({
        message: "You are already the highest bidder",
      });
    }

    const currentAmount = Number(auction.currentBid || auction.startingBid);
    const minimumAddAmount = Number(auction.bidIncrement || 1);
    const addAmount = Number(amountToAdd);

    if (!addAmount || addAmount < minimumAddAmount) {
      return res.status(400).json({
        message: `Minimum amount to add is $${minimumAddAmount.toFixed(2)}`,
      });
    }

    const bidAmount = currentAmount + addAmount;

    const bid = await prisma.$transaction(async (tx) => {
      const createdBid = await tx.bid.create({
        data: {
          amount: bidAmount,
          auctionId,
          bidderId,
        },
      });

      await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentBid: bidAmount,
        },
      });

      return createdBid;
    });

    return res.status(201).json({
      message: "Bid placed successfully",
      bid,
      currentAmount,
      amountAdded: addAmount,
      newBidAmount: bidAmount,
    });
  } catch (error) {
    console.error("Place bid error:", error);
    return res.status(500).json({ message: "Server error placing bid" });
  }
});

router.post("/:id/buyout", authMiddleware, async (req, res) => {
  try {
    const auctionId = req.params.id;
    const buyerId = req.user.userId;

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.status !== ACTIVE) {
      return res.status(400).json({ message: "Auction is not active" });
    }

    if (new Date(auction.endsAt) <= new Date()) {
      await finalizeAuctionIfEnded(auctionId);
      return res.status(400).json({ message: "Auction has ended" });
    }

    if (!auction.buyoutPrice) {
      return res
        .status(400)
        .json({ message: "This auction has no buyout option" });
    }

    if (auction.sellerId === buyerId) {
      return res.status(400).json({
        message: "You cannot buyout your own auction",
      });
    }

    const updatedAuction = await prisma.$transaction(async (tx) => {
      const auctionAfterBuyout = await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: AWAITING_PAYMENT,
          winnerId: buyerId,
          winnerRank: 0,
          winnerSource: "BUYOUT",
          currentBid: auction.buyoutPrice,
          paymentDueAt: getPaymentDueDate(),
        },
      });

      await tx.cartItem.upsert({
        where: {
          userId_auctionId: {
            userId: buyerId,
            auctionId,
          },
        },
        update: {
          quantity: 1,
          price: Number(auction.buyoutPrice),
        },
        create: {
          userId: buyerId,
          auctionId,
          quantity: 1,
          price: Number(auction.buyoutPrice),
        },
      });

      return auctionAfterBuyout;
    });

    return res.json({
      message: "Buyout successful. The auction item has been added to your cart.",
      auction: updatedAuction,
    });
  } catch (error) {
    console.error("Buyout error:", error);
    return res.status(500).json({ message: "Server error processing buyout" });
  }
});

router.post("/:id/end", authMiddleware, async (req, res) => {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: req.params.id },
    });

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.sellerId !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (auction.status !== ACTIVE) {
      return res.status(400).json({ message: "Auction is not active" });
    }

    if (new Date(auction.endsAt) > new Date()) {
      return res.status(400).json({
        message: "Auction has not reached its end time yet",
      });
    }

    let updatedAuction = await finalizeAuctionIfEnded(req.params.id);

    if (updatedAuction) {
      updatedAuction = await forfeitAuctionIfPaymentExpired(req.params.id);
    }

    return res.json({
      message: "Auction ended",
      auction: updatedAuction,
    });
  } catch (error) {
    console.error("End auction error:", error);
    return res.status(500).json({ message: "Server error ending auction" });
  }
});

router.post("/:id/reallocate", authMiddleware, async (req, res) => {
  try {
    let auction = await getAuctionWithDetails(req.params.id);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.sellerId !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    auction = await forfeitAuctionIfPaymentExpired(auction.id);

    const canReallocate =
      auction.status === EXPIRED_UNPAID || isPaymentOverdue(auction);

    if (!canReallocate) {
      return res.status(400).json({
        message: "Auction payment has not expired yet.",
      });
    }

    const uniqueHighestBids = getUniqueHighestBids(auction.bids);

    const nextIndex =
      auction.winnerSource === "BUYOUT" ? 0 : Number(auction.winnerRank || 0);

    const nextWinnerBid = uniqueHighestBids[nextIndex];

    if (!nextWinnerBid) {
      return res.status(400).json({
        message:
          "No next bidder available. You can repost, move to marketplace, or delete this auction.",
      });
    }

    const updatedAuction = await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: {
          auctionId: auction.id,
        },
      });

      const auctionAfterReallocate = await tx.auction.update({
        where: { id: auction.id },
        data: {
          status: AWAITING_PAYMENT,
          winnerId: nextWinnerBid.bidderId,
          winnerRank:
            auction.winnerSource === "BUYOUT"
              ? 1
              : Number(auction.winnerRank || 0) + 1,
          winnerSource: "REALLOCATED",
          currentBid: nextWinnerBid.amount,
          paymentDueAt: getPaymentDueDate(),
        },
      });

      await tx.cartItem.upsert({
        where: {
          userId_auctionId: {
            userId: nextWinnerBid.bidderId,
            auctionId: auction.id,
          },
        },
        update: {
          quantity: 1,
          price: Number(nextWinnerBid.amount),
        },
        create: {
          userId: nextWinnerBid.bidderId,
          auctionId: auction.id,
          quantity: 1,
          price: Number(nextWinnerBid.amount),
        },
      });

      return auctionAfterReallocate;
    });

    return res.json({
      message: "Auction offered to next highest bidder and added to their cart.",
      auction: updatedAuction,
    });
  } catch (error) {
    console.error("Reallocate auction error:", error);
    return res
      .status(500)
      .json({ message: "Server error reallocating auction" });
  }
});

router.post("/:id/repost", authMiddleware, async (req, res) => {
  try {
    let auction = await getAuctionWithDetails(req.params.id);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.sellerId !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    auction = await forfeitAuctionIfPaymentExpired(auction.id);

    const auctionEnded =
      auction.endsAt && new Date(auction.endsAt) <= new Date();

    const canRepost =
      auction.status === EXPIRED_UNPAID ||
      isPaymentOverdue(auction) ||
      (auction.status === ACTIVE && auctionEnded);

    if (!canRepost) {
      return res.status(400).json({
        message: "Only ended or expired unpaid auctions can be reposted.",
      });
    }

    const {
      title,
      description,
      category,
      condition,
      startingBid,
      bidIncrement,
      buyoutPrice,
      endsAt,
    } = req.body;

    const repostTitle = title || auction.title;
    const repostDescription =
      description === undefined ? auction.description : description;
    const repostCategory = category || auction.category;
    const repostCondition = condition || auction.condition;

    const startingBidNumber =
      startingBid === undefined || startingBid === ""
        ? Number(auction.startingBid)
        : Number(startingBid);

    const bidIncrementNumber =
      bidIncrement === undefined || bidIncrement === ""
        ? Number(auction.bidIncrement || 1)
        : Number(bidIncrement);

    const buyoutPriceNumber =
      buyoutPrice === undefined || buyoutPrice === "" || buyoutPrice === null
        ? null
        : Number(buyoutPrice);

    const repostEndDate = endsAt ? new Date(endsAt) : getRepostEndDate();

    if (!repostTitle) {
      return res.status(400).json({ message: "Auction title is required." });
    }

    if (!startingBidNumber || startingBidNumber <= 0) {
      return res.status(400).json({
        message: "Starting bid must be above 0.",
      });
    }

    if (!bidIncrementNumber || bidIncrementNumber <= 0) {
      return res.status(400).json({
        message: "Bid increment must be above 0.",
      });
    }

    if (buyoutPriceNumber !== null && buyoutPriceNumber <= startingBidNumber) {
      return res.status(400).json({
        message: "Buyout price must be higher than starting bid.",
      });
    }

    if (
      !repostEndDate ||
      Number.isNaN(repostEndDate.getTime()) ||
      repostEndDate <= new Date()
    ) {
      return res.status(400).json({
        message: "Auction end date must be in the future.",
      });
    }

    const updatedAuction = await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: {
          auctionId: auction.id,
        },
      });

      await tx.bid.deleteMany({
        where: {
          auctionId: auction.id,
        },
      });

      return tx.auction.update({
        where: { id: auction.id },
        data: {
          title: repostTitle,
          description: repostDescription,
          category: repostCategory,
          condition: repostCondition,
          startingBid: startingBidNumber,
          currentBid: null,
          bidIncrement: bidIncrementNumber,
          buyoutPrice: buyoutPriceNumber,
          endsAt: repostEndDate,
          status: ACTIVE,
          winnerId: null,
          winnerRank: 0,
          winnerSource: null,
          paymentDueAt: null,
          paidAt: null,
        },
      });
    });

    return res.json({
      message: "Auction reposted successfully.",
      auction: updatedAuction,
    });
  } catch (error) {
    console.error("Repost auction error:", error);
    return res.status(500).json({
      message: "Server error reposting auction",
      error: error.message,
    });
  }
});

router.post("/:id/convert-to-product", authMiddleware, async (req, res) => {
  try {
    let auction = await getAuctionWithDetails(req.params.id);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.sellerId !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    auction = await forfeitAuctionIfPaymentExpired(auction.id);

    const canConvert =
      auction.status === EXPIRED_UNPAID || isPaymentOverdue(auction);

    if (!canConvert) {
      return res.status(400).json({
        message: "Only expired unpaid auctions can be moved to marketplace.",
      });
    }

    const {
      title,
      description,
      price,
      stock,
      category,
      condition,
      deliveryMethods,
    } = req.body;

    const listingTitle = title || auction.title;
    const listingDescription = description ?? auction.description;
    const listingPrice = Number(price);
    const listingStock = Number(stock || 1);
    const listingCategory = category || auction.category;
    const listingCondition = condition || auction.condition;

    let parsedDeliveryMethods = ["SELF_COLLECTION", "STANDARD_DELIVERY"];

    if (deliveryMethods) {
      try {
        parsedDeliveryMethods =
          typeof deliveryMethods === "string"
            ? JSON.parse(deliveryMethods)
            : deliveryMethods;
      } catch {
        parsedDeliveryMethods = ["SELF_COLLECTION", "STANDARD_DELIVERY"];
      }
    }

    if (!listingTitle) {
      return res.status(400).json({ message: "Listing title is required." });
    }

    if (!listingPrice || listingPrice <= 0) {
      return res.status(400).json({
        message: "Marketplace price must be above 0.",
      });
    }

    if (listingStock <= 0) {
      return res.status(400).json({
        message: "Stock must be at least 1.",
      });
    }

    if (!Array.isArray(parsedDeliveryMethods) || !parsedDeliveryMethods.length) {
      return res.status(400).json({
        message: "Please select at least one delivery method.",
      });
    }

    const listing = await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: {
          auctionId: auction.id,
        },
      });

      await tx.bid.deleteMany({
        where: {
          auctionId: auction.id,
        },
      });

      const createdListing = await tx.listing.create({
        data: {
          title: listingTitle,
          description: listingDescription,
          imageUrl: auction.imageUrl,
          category: listingCategory,
          condition: listingCondition,
          price: listingPrice,
          stock: listingStock,
          deliveryMethods: parsedDeliveryMethods,
          sellerId: auction.sellerId,
        },
      });

      await tx.auction.delete({
        where: {
          id: auction.id,
        },
      });

      return createdListing;
    });

    return res.json({
      message: "Auction moved to marketplace successfully.",
      listing,
    });
  } catch (error) {
    console.error("Convert auction to marketplace error:", error);
    return res.status(500).json({
      message: "Server error moving auction to marketplace",
      error: error.message,
    });
  }
});

router.post("/:id/mark-paid", authMiddleware, async (req, res) => {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: req.params.id },
    });

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.status !== AWAITING_PAYMENT) {
      return res.status(400).json({
        message: "Auction is not awaiting payment",
      });
    }

    if (
      auction.winnerId !== req.user.userId &&
      auction.sellerId !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Only the winner or seller can mark this auction as paid",
      });
    }

    const updatedAuction = await prisma.auction.update({
      where: { id: auction.id },
      data: {
        status: PAID,
        paidAt: new Date(),
      },
    });

    return res.json({
      message: "Auction marked as paid",
      auction: updatedAuction,
    });
  } catch (error) {
    console.error("Mark auction paid error:", error);
    return res
      .status(500)
      .json({ message: "Server error marking auction as paid" });
  }
});

router.post("/:id/complete-order", authMiddleware, async (req, res) => {
  try {
    const auctionId = req.params.id;
    const sellerId = req.user.userId;

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.sellerId !== sellerId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (auction.status !== PAID) {
      return res.status(400).json({
        message: "Only paid auction orders can be marked as completed.",
      });
    }

    const orderItem = await prisma.orderItem.findFirst({
      where: {
        auctionId,
      },
    });

    if (!orderItem) {
      return res.status(404).json({
        message: "Auction order item not found.",
      });
    }

    if (["completed", "collected"].includes(orderItem.deliveryStatus)) {
      return res.json({
        message: "Auction order is already completed.",
        orderItem,
      });
    }

    const updatedOrderItem = await prisma.orderItem.update({
      where: {
        id: orderItem.id,
      },
      data: {
        deliveryStatus: "completed",
      },
    });

    return res.json({
      message: "Auction order marked as completed.",
      orderItem: updatedOrderItem,
    });
  } catch (error) {
    console.error("Complete auction order error:", error);
    return res.status(500).json({
      message: "Server error marking auction order as completed",
    });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    let auction = await getAuctionWithDetails(req.params.id);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.sellerId !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    auction = await forfeitAuctionIfPaymentExpired(auction.id);

    const completedOrderItem = await getCompletedOrderItemForAuction(
      auction.id
    );

    const canDelete =
      auction.bids.length === 0 ||
      auction.status === EXPIRED_UNPAID ||
      isPaymentOverdue(auction) ||
      Boolean(completedOrderItem);

    if (!canDelete) {
      return res.status(400).json({
        message:
          "Cannot delete this auction unless it has no bids, is completed, or payment has expired.",
      });
    }

    const imageUrlToDelete = auction.imageUrl;

    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: {
          auctionId: auction.id,
        },
      });

      await tx.bid.deleteMany({
        where: {
          auctionId: auction.id,
        },
      });

      await tx.orderItem.updateMany({
        where: {
          auctionId: auction.id,
        },
        data: {
          auctionId: null,
        },
      });

      await tx.auction.delete({
        where: {
          id: auction.id,
        },
      });
    });

    await deleteImageFromFirebase(imageUrlToDelete);

    return res.json({ message: "Auction posting deleted" });
  } catch (error) {
    console.error("Delete auction error:", error);
    return res.status(500).json({ message: "Server error deleting auction" });
  }
});

module.exports = router;