const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { bucket } = require("../lib/firebaseAdmin");
const { getDownloadURL } = require("firebase-admin/storage");

const router = express.Router();

async function uploadImageToFirebase(file) {
  if (!file) return null;

  const fileName = `listings/${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
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

    const imageUrl = await uploadImageToFirebase(req.file);

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

router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, stock, category, condition } = req.body;

    const existingProduct = await prisma.listing.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (existingProduct.sellerId !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to edit this product" });
    }

    let imageUrl = existingProduct.imageUrl || null;

    if (req.file) {
      imageUrl = await uploadImageToFirebase(req.file);
    }

    const updatedProduct = await prisma.listing.update({
      where: { id },
      data: {
        title,
        description,
        price: Number(price),
        stock: Number(stock || 0),
        category,
        condition,
        imageUrl,
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
      return res.status(403).json({ message: "Not authorized to delete this product" });
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