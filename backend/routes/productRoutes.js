const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { bucket } = require("../lib/firebaseAdmin");
const { getDownloadURL } = require("firebase-admin/storage");

const router = express.Router();

const DEFAULT_DELIVERY_METHODS = ["SELF_COLLECTION", "STANDARD_DELIVERY"];
const VALID_DELIVERY_METHODS = ["SELF_COLLECTION", "STANDARD_DELIVERY"];

function parseDeliveryMethods(deliveryMethods, fallback = DEFAULT_DELIVERY_METHODS) {
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

  const fileName = `listings/${Date.now()}-${file.originalname.replace(
    /\s+/g,
    "-"
  )}`;

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
      queryOptions.take = Number(limit);
      queryOptions.skip = (Number(page) - 1) * Number(limit);
    }

    const products = await prisma.listing.findMany(queryOptions);

    return res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({ message: "Server error fetching products" });
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

    if (!productTitle || price === undefined) {
      return res.status(400).json({ message: "Title and price are required" });
    }

    const parsedDeliveryMethods = parseDeliveryMethods(deliveryMethods);

    const imageUrl = await uploadImageToFirebase(req.file);

    const product = await prisma.listing.create({
      data: {
        title: productTitle,
        description,
        price: Number(price),
        stock: Number(stock || 0),
        imageUrl,
        category,
        condition,
        deliveryMethods: parsedDeliveryMethods,
        sellerId: req.user.userId,
      },
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({ message: "Server error creating product" });
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
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    console.error("Get product by id error:", error);
    return res.status(500).json({ message: "Server error fetching product" });
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
      return res.status(404).json({ message: "Product not found" });
    }

    if (existingProduct.sellerId !== req.user.userId) {
      return res.status(403).json({
        message: "Not authorized to edit this product",
      });
    }

    if (!productTitle || price === undefined) {
      return res.status(400).json({ message: "Title and price are required" });
    }

    const parsedDeliveryMethods = parseDeliveryMethods(
      deliveryMethods,
      existingProduct.deliveryMethods || DEFAULT_DELIVERY_METHODS
    );

    let imageUrl = existingProduct.imageUrl || null;

    if (req.file) {
      imageUrl = await uploadImageToFirebase(req.file);
    }

    const updatedProduct = await prisma.listing.update({
      where: { id },
      data: {
        title: productTitle,
        description,
        price: Number(price),
        stock: Number(stock || 0),
        category,
        condition,
        imageUrl,
        deliveryMethods: parsedDeliveryMethods,
      },
    });

    return res.json(updatedProduct);
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({ message: "Server error updating product" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.listing.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (existingProduct.sellerId !== req.user.userId) {
      return res.status(403).json({
        message: "Not authorized to delete this product",
      });
    }

    await prisma.listing.delete({
      where: { id },
    });

    return res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ message: "Server error deleting product" });
  }
});

module.exports = router;