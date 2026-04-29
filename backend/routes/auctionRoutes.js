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

function getUniqueHighestBids(bids) {
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

  await prisma.auction.update({
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

    return res.json(auctions);
  } catch (error) {
    console.error("Get seller auctions error:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching seller auctions" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const auction = await finalizeAuctionIfEnded(req.params.id);

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
    const { amount } = req.body;
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

    const currentAmount = auction.currentBid || auction.startingBid;
    const minimumBid = Number(currentAmount) + Number(auction.bidIncrement || 1);
    const bidAmount = Number(amount);

    if (!bidAmount || bidAmount < minimumBid) {
      return res.status(400).json({
        message: `Minimum bid is $${minimumBid.toFixed(2)}`,
      });
    }

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

    const updatedAuction = await prisma.auction.update({
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

    return res.json({
      message: "Buyout successful. Please complete payment within 3 days.",
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

    const updatedAuction = await finalizeAuctionIfEnded(req.params.id);

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
    const auction = await getAuctionWithDetails(req.params.id);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.sellerId !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (auction.status !== AWAITING_PAYMENT) {
      return res.status(400).json({
        message: "Auction is not awaiting payment",
      });
    }

    if (!auction.paymentDueAt || new Date(auction.paymentDueAt) > new Date()) {
      return res.status(400).json({
        message: "Payment deadline has not passed yet",
      });
    }

    const uniqueHighestBids = getUniqueHighestBids(auction.bids);

    const nextIndex =
      auction.winnerSource === "BUYOUT" ? 0 : Number(auction.winnerRank || 0);

    const nextWinnerBid = uniqueHighestBids[nextIndex];

    if (!nextWinnerBid) {
      const expiredAuction = await prisma.auction.update({
        where: { id: auction.id },
        data: {
          status: EXPIRED_UNPAID,
          winnerId: null,
          paymentDueAt: null,
        },
      });

      return res.json({
        message: "No more bidders available. Auction expired unpaid.",
        auction: expiredAuction,
      });
    }

    const updatedAuction = await prisma.auction.update({
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

    return res.json({
      message: "Auction offered to next highest bidder",
      auction: updatedAuction,
    });
  } catch (error) {
    console.error("Reallocate auction error:", error);
    return res
      .status(500)
      .json({ message: "Server error reallocating auction" });
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

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: req.params.id },
      include: {
        bids: true,
      },
    });

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.sellerId !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (auction.bids.length > 0) {
      return res.status(400).json({
        message: "Cannot delete auction after bids have been placed",
      });
    }

    await prisma.auction.delete({
      where: { id: auction.id },
    });

    return res.json({ message: "Auction deleted" });
  } catch (error) {
    console.error("Delete auction error:", error);
    return res.status(500).json({ message: "Server error deleting auction" });
  }
});

module.exports = router;