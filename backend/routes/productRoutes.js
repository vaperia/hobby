const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const products = await prisma.listing.findMany({
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

    return res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({ message: "Server error fetching products" });
  }
});

router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { title, description, price, stock, category, condition } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ message: "Title and price are required" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const product = await prisma.listing.create({
      data: {
        title,
        description,
        price: Number(price),
        stock: Number(stock || 0),
        imageUrl,
        category,
        condition,
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

module.exports = router;