const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

function getCartItemPrice(item) {
  return Number(
    item.price ??
      item.product?.price ??
      item.auction?.currentBid ??
      item.auction?.startingBid ??
      0
  );
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.userId },
      include: {
        product: {
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        auction: {
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = cartItems.reduce((sum, item) => {
      const price = getCartItemPrice(item);
      return sum + Number(item.quantity || 1) * price;
    }, 0);

    res.json({
      items: cartItems,
      total,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Server error fetching cart" });
  }
});

router.post("/items", authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const product = await prisma.listing.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId === req.user.userId) {
      return res.status(400).json({
        message: "You cannot add your own product to cart",
      });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user.userId,
          productId,
        },
      },
    });

    let cartItem;

    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + Number(quantity),
          price: Number(product.price),
        },
        include: {
          product: true,
          auction: true,
        },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: req.user.userId,
          productId,
          quantity: Number(quantity),
          price: Number(product.price),
        },
        include: {
          product: true,
          auction: true,
        },
      });
    }

    res.status(201).json(cartItem);
  } catch (error) {
    console.error("Add cart item error:", error);
    res.status(500).json({ message: "Server error adding item to cart" });
  }
});

router.patch("/items/:itemId", authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || Number(quantity) < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        userId: req.user.userId,
      },
    });

    if (!existingItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (existingItem.auctionId) {
      return res.status(400).json({
        message: "Auction items must stay as quantity 1",
      });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: Number(quantity) },
      include: {
        product: true,
        auction: true,
      },
    });

    res.json(updatedItem);
  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({ message: "Server error updating cart item" });
  }
});

router.delete("/items/:itemId", authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        userId: req.user.userId,
      },
    });

    if (!existingItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Delete cart item error:", error);
    res.status(500).json({ message: "Server error removing cart item" });
  }
});

router.delete("/", authMiddleware, async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user.userId },
    });

    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Server error clearing cart" });
  }
});

module.exports = router;