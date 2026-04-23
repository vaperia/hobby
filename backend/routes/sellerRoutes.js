const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const sellerId = req.user.userId;

    const listings = await prisma.listing.findMany({
      where: { sellerId },
      select: {
        id: true,
        title: true,
      },
    });

    const listingIds = listings.map((listing) => listing.id);

    const sellerOrders = await prisma.orderItem.findMany({
      where: {
        productId: { in: listingIds.length ? listingIds : ["no-match"] },
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        },
        product: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalRevenue = sellerOrders.reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity;
    }, 0);

    const recentOrders = sellerOrders.slice(0, 5).map((item) => ({
      id: item.order?.id,
      buyer: item.order?.user?.username || item.order?.user?.email || "Unknown",
      item: item.product?.title || "Product",
      total: Number(item.price) * item.quantity,
      status: item.order?.status || "pending",
    }));

    res.json({
      stats: {
        activeListings: listings.length,
        ordersReceived: sellerOrders.length,
        totalRevenue,
        lowStockItems: 0,
      },
      recentOrders,
    });
  } catch (error) {
    console.error("Seller dashboard error:", error);
    res.status(500).json({ message: "Server error fetching seller dashboard" });
  }
});

module.exports = router;