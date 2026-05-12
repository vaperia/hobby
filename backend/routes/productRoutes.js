const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { bucket, deleteImageFromFirebase } = require("../lib/firebaseAdmin");
const { getDownloadURL } = require("firebase-admin/storage");

const router = express.Router();

const DEFAULT_DELIVERY_METHODS = ["SELF_COLLECTION", "STANDARD_DELIVERY"];
const VALID_DELIVERY_METHODS = ["SELF_COLLECTION", "STANDARD_DELIVERY"];

function getSellerType(user) {
  const role = String(user?.role || "buyer").toLowerCase();

  if (role === "seller" || role === "admin") {
    return "SHOP";
  }

  return "PRIVATE";
}

function parseDeliveryMethods(
  deliveryMethods,
  fallback = DEFAULT_DELIVERY_METHODS
) {
  if (!deliveryMethods) return fallback;

  let parsedMethods = fallback;

  try {
    parsedMethods =
      typeof deliveryMethods === "string"
        ? JSON.parse(deliveryMethods)
        : deliveryMethods;
  } catch {
    parsedMethods = fallback;
  }

  if (!Array.isArray(parsedMethods)) {
    return fallback;
  }

  const cleanedMethods = parsedMethods.filter((method) =>
    VALID_DELIVERY_METHODS.includes(method)
  );

  return cleanedMethods.length ? cleanedMethods : fallback;
}

async function uploadImageToFirebase(file) {
  if (!file) return null;

  const safeFileName = file.originalname.replace(/\s+/g, "-");
  const fileName = `listings/${Date.now()}-${safeFileName}`;

  const firebaseFile = bucket.file(fileName);

  await firebaseFile.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
  });

  const downloadURL = await getDownloadURL(firebaseFile);
  return downloadURL;
}

router.get("/", async (req, res) => {
  try {
    const { category, search, sort, featured, page = 1, limit } = req.query;

    const where = {};

    if (category && category !== "All") {
      where.category = {
        equals: category,
        mode: "insensitive",
      };
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
        {
          category: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    let orderBy = {
      createdAt: "desc",
    };

    if (sort === "price-low") {
      orderBy = {
        price: "asc",
      };
    }

    if (sort === "price-high") {
      orderBy = {
        price: "desc",
      };
    }

    const queryOptions = {
      where,
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy,
    };

    if (limit) {
      const take = Number(limit);
      const currentPage = Number(page);

      if (!Number.isNaN(take) && take > 0) {
        queryOptions.take = take;
        queryOptions.skip = (currentPage - 1) * take;
      }
    }

    const products = await prisma.listing.findMany(queryOptions);

    return res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({
      message: "Server error fetching products",
    });
  }
});

router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const {
      title,
      name,
      description,
      price,
      stock,
      category,
      condition,
      deliveryMethods,
    } = req.body;

    const productTitle = title || name;

    if (!productTitle || price === undefined || price === "") {
      return res.status(400).json({
        message: "Title and price are required",
      });
    }

    const priceNumber = Number(price);
    const stockNumber = Number(stock || 0);

    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      return res.status(400).json({
        message: "Price must be a valid number",
      });
    }

    if (Number.isNaN(stockNumber) || stockNumber < 0) {
      return res.status(400).json({
        message: "Stock must be a valid number",
      });
    }

    const parsedDeliveryMethods = parseDeliveryMethods(deliveryMethods);
    const sellerType = getSellerType(req.user);
    const imageUrl = await uploadImageToFirebase(req.file);

    const product = await prisma.listing.create({
      data: {
        title: productTitle,
        description,
        price: priceNumber,
        stock: stockNumber,
        imageUrl,
        category,
        condition,
        deliveryMethods: parsedDeliveryMethods,
        sellerId: req.user.userId,
        sellerType,
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({
      message: "Server error creating product",
    });
  }
});

/**
 * IMPORTANT:
 * This route must be above router.get("/:id")
 * or Express will treat "seller/my-listings" as an id.
 */
router.get("/seller/my-listings", authMiddleware, async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        sellerId: req.user.userId,
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(listings);
  } catch (error) {
    console.error("Get my listings error:", error);
    return res.status(500).json({
      message: "Server error fetching your listings",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.json(product);
  } catch (error) {
    console.error("Get product by id error:", error);
    return res.status(500).json({
      message: "Server error fetching product",
    });
  }
});

router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      name,
      description,
      price,
      stock,
      category,
      condition,
      deliveryMethods,
    } = req.body;

    const productTitle = title || name;

    const existingProduct = await prisma.listing.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (existingProduct.sellerId !== req.user.userId) {
      return res.status(403).json({
        message: "Not authorized to edit this product",
      });
    }

    if (!productTitle || price === undefined || price === "") {
      return res.status(400).json({
        message: "Title and price are required",
      });
    }

    const priceNumber = Number(price);
    const stockNumber = Number(stock || 0);

    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      return res.status(400).json({
        message: "Price must be a valid number",
      });
    }

    if (Number.isNaN(stockNumber) || stockNumber < 0) {
      return res.status(400).json({
        message: "Stock must be a valid number",
      });
    }

    const parsedDeliveryMethods = parseDeliveryMethods(
      deliveryMethods,
      existingProduct.deliveryMethods || DEFAULT_DELIVERY_METHODS
    );

    let imageUrl = existingProduct.imageUrl || null;
    let oldImageUrlToDelete = null;

    if (req.file) {
      oldImageUrlToDelete = existingProduct.imageUrl;
      imageUrl = await uploadImageToFirebase(req.file);
    }

    const updatedProduct = await prisma.listing.update({
      where: { id },
      data: {
        title: productTitle,
        description,
        price: priceNumber,
        stock: stockNumber,
        category,
        condition,
        imageUrl,
        deliveryMethods: parsedDeliveryMethods,
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (oldImageUrlToDelete && oldImageUrlToDelete !== updatedProduct.imageUrl) {
      await deleteImageFromFirebase(oldImageUrlToDelete);
    }

    return res.json(updatedProduct);
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({
      message: "Server error updating product",
    });
  }
});

router.post("/:id/convert-to-auction", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    if (listing.sellerId !== req.user.userId) {
      return res.status(403).json({
        message: "Not authorized to convert this listing",
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

    const auctionTitle = title || listing.title;
    const auctionDescription = description ?? listing.description;
    const auctionCategory = category || listing.category;
    const auctionCondition = condition || listing.condition;

    const startingBidNumber = Number(startingBid);
    const bidIncrementNumber = Number(bidIncrement || 1);

    const buyoutPriceNumber =
      buyoutPrice === undefined || buyoutPrice === "" || buyoutPrice === null
        ? null
        : Number(buyoutPrice);

    const endDate = new Date(endsAt);

    if (!auctionTitle) {
      return res.status(400).json({
        message: "Auction title is required.",
      });
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

    if (!endsAt || Number.isNaN(endDate.getTime()) || endDate <= new Date()) {
      return res.status(400).json({
        message: "Auction end date must be in the future.",
      });
    }

    const auction = await prisma.$transaction(async (tx) => {
      const createdAuction = await tx.auction.create({
        data: {
          title: auctionTitle,
          description: auctionDescription,
          imageUrl: listing.imageUrl,
          category: auctionCategory,
          condition: auctionCondition,
          startingBid: startingBidNumber,
          currentBid: null,
          bidIncrement: bidIncrementNumber,
          buyoutPrice: buyoutPriceNumber,
          endsAt: endDate,
          status: "ACTIVE",
          sellerId: listing.sellerId,
          sellerType: listing.sellerType || "PRIVATE",
        },
      });

      await tx.cartItem.deleteMany({
        where: {
          productId: listing.id,
        },
      });

      await tx.listing.delete({
        where: {
          id: listing.id,
        },
      });

      return createdAuction;
    });

    return res.json({
      message: "Marketplace listing moved to auction successfully.",
      auction,
    });
  } catch (error) {
    console.error("Convert listing to auction error:", error);
    return res.status(500).json({
      message: "Server error moving listing to auction",
      error: error.message,
    });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.listing.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (existingProduct.sellerId !== req.user.userId) {
      return res.status(403).json({
        message: "Not authorized to delete this product",
      });
    }

    const imageUrlToDelete = existingProduct.imageUrl;

    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: {
          productId: existingProduct.id,
        },
      });

      await tx.orderItem.updateMany({
        where: {
          productId: existingProduct.id,
        },
        data: {
          productId: null,
        },
      });

      await tx.listing.delete({
        where: {
          id: existingProduct.id,
        },
      });
    });

    await deleteImageFromFirebase(imageUrlToDelete);

    return res.json({
      message: "Product and Firebase image deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({
      message: "Server error deleting product",
    });
  }
});

module.exports = router;