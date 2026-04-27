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
        description: true,
        price: true,
        stock: true,
        imageUrl: true,
        category: true,
        condition: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const listingIds = listings.map((listing) => listing.id);

    const sellerOrders = await prisma.orderItem.findMany({
      where: {
        productId: {
          in: listingIds.length ? listingIds : ["no-match"],
        },
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
      return sum + Number(item.price) * Number(item.quantity || 0);
    }, 0);

    const lowStockItems = listings.filter((listing) => {
      const stock = Number(listing.stock || 0);
      return stock > 0 && stock <= 5;
    }).length;

    const recentOrders = sellerOrders.slice(0, 5).map((item) => ({
      id: item.order?.id,
      buyer: item.order?.user?.username || item.order?.user?.email || "Unknown",
      item: item.product?.title || "Product",
      total: Number(item.price) * Number(item.quantity || 0),
      status: item.order?.status || "pending",
    }));

    return res.json({
      stats: {
        activeListings: listings.length,
        ordersReceived: sellerOrders.length,
        totalRevenue,
        lowStockItems,
      },
      listings,
      recentOrders,
    });
  } catch (error) {
    console.error("Seller dashboard error:", error);
    return res.status(500).json({
      message: "Server error fetching seller dashboard",
    });
  }
});

module.exports = router;