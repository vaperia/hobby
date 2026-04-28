const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const VALID_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "completed",
  "cancelled",
  "ready_for_collection",
  "collected",
];

function formatSellerOrderItem(item) {
  return {
    id: item.order?.id,
    orderItemId: item.id,
    buyer: item.order?.user?.username || item.order?.user?.email || "Unknown",
    buyerEmail: item.order?.user?.email || "",
    item: item.product?.title || "Product",
    productId: item.product?.id,
    productImage: item.product?.imageUrl || "",
    category: item.product?.category || "Uncategorized",
    quantity: item.quantity,
    price: Number(item.price || 0),
    total: Number(item.price || 0) * Number(item.quantity || 0),
    status: item.order?.status || "pending",
    shippingMethod: item.order?.shippingMethod || "",
    shippingFee: Number(item.order?.shippingFee || 0),
    orderTotal: Number(item.order?.totalAmount || 0),
    createdAt: item.order?.createdAt,
    updatedAt: item.order?.updatedAt,
  };
}

async function getSellerListings(sellerId) {
  return prisma.listing.findMany({
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
      deliveryMethods: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function getSellerOrderItems(sellerId) {
  return prisma.orderItem.findMany({
    where: {
      product: {
        sellerId,
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
          id: true,
          title: true,
          imageUrl: true,
          category: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const sellerId = req.user.userId;

    const listings = await getSellerListings(sellerId);
    const sellerOrders = await getSellerOrderItems(sellerId);

    const totalRevenue = sellerOrders.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.quantity || 0);
    }, 0);

    const lowStockItems = listings.filter((listing) => {
      const stock = Number(listing.stock || 0);
      return stock > 0 && stock <= 5;
    }).length;

    const pendingOrders = sellerOrders.filter((item) => {
      return item.order?.status === "pending";
    }).length;

    const completedOrders = sellerOrders.filter((item) => {
      return item.order?.status === "completed" || item.order?.status === "collected";
    }).length;

    const recentOrders = sellerOrders.slice(0, 10).map(formatSellerOrderItem);

    return res.json({
      stats: {
        activeListings: listings.length,
        ordersReceived: sellerOrders.length,
        totalRevenue,
        lowStockItems,
        pendingOrders,
        completedOrders,
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

router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const sellerOrders = await getSellerOrderItems(sellerId);

    return res.json(sellerOrders.map(formatSellerOrderItem));
  } catch (error) {
    console.error("Seller orders error:", error);
    return res.status(500).json({
      message: "Server error fetching seller orders",
    });
  }
});

router.get("/reports", authMiddleware, async (req, res) => {
  try {
    const sellerId = req.user.userId;

    const listings = await getSellerListings(sellerId);
    const sellerOrders = await getSellerOrderItems(sellerId);

    const totalRevenue = sellerOrders.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.quantity || 0);
    }, 0);

    const totalUnitsSold = sellerOrders.reduce((sum, item) => {
      return sum + Number(item.quantity || 0);
    }, 0);

    const uniqueOrderIds = new Set(
      sellerOrders.map((item) => item.orderId).filter(Boolean)
    );

    const completedOrders = sellerOrders.filter((item) => {
      return item.order?.status === "completed" || item.order?.status === "collected";
    });

    const pendingOrders = sellerOrders.filter((item) => {
      return item.order?.status === "pending";
    });

    const cancelledOrders = sellerOrders.filter((item) => {
      return item.order?.status === "cancelled";
    });

    const averageOrderValue =
      uniqueOrderIds.size > 0 ? totalRevenue / uniqueOrderIds.size : 0;

    const productMap = {};

    sellerOrders.forEach((item) => {
      const productId = item.product?.id || item.productId;
      const productName = item.product?.title || "Product";
      const quantity = Number(item.quantity || 0);
      const revenue = Number(item.price || 0) * quantity;

      if (!productMap[productId]) {
        productMap[productId] = {
          productId,
          productName,
          unitsSold: 0,
          revenue: 0,
        };
      }

      productMap[productId].unitsSold += quantity;
      productMap[productId].revenue += revenue;
    });

    const topProducts = Object.values(productMap).sort((a, b) => {
      return b.revenue - a.revenue;
    });

    const categoryMap = {};

    sellerOrders.forEach((item) => {
      const category = item.product?.category || "Uncategorized";
      const quantity = Number(item.quantity || 0);
      const revenue = Number(item.price || 0) * quantity;

      if (!categoryMap[category]) {
        categoryMap[category] = {
          category,
          unitsSold: 0,
          revenue: 0,
        };
      }

      categoryMap[category].unitsSold += quantity;
      categoryMap[category].revenue += revenue;
    });

    const revenueByCategory = Object.values(categoryMap).sort((a, b) => {
      return b.revenue - a.revenue;
    });

    const lowStockListings = listings.filter((listing) => {
      const stock = Number(listing.stock || 0);
      return stock > 0 && stock <= 5;
    });

    return res.json({
      summary: {
        totalRevenue,
        totalOrders: uniqueOrderIds.size,
        totalOrderItems: sellerOrders.length,
        totalUnitsSold,
        averageOrderValue,
        completedOrders: completedOrders.length,
        pendingOrders: pendingOrders.length,
        cancelledOrders: cancelledOrders.length,
        activeListings: listings.length,
        lowStockItems: lowStockListings.length,
      },
      topProducts,
      revenueByCategory,
      lowStockListings,
      recentOrders: sellerOrders.slice(0, 10).map(formatSellerOrderItem),
    });
  } catch (error) {
    console.error("Seller reports error:", error);
    return res.status(500).json({
      message: "Server error fetching seller reports",
    });
  }
});

router.get("/shop", authMiddleware, async (req, res) => {
  try {
    const sellerId = req.user.userId;

    const seller = await prisma.user.findUnique({
      where: {
        id: sellerId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const listings = await getSellerListings(sellerId);

    const categories = [...new Set(listings.map((item) => item.category).filter(Boolean))];

    const deliveryMethods = [
      ...new Set(
        listings.flatMap((item) => item.deliveryMethods || [])
      ),
    ];

    return res.json({
      seller,
      stats: {
        totalListings: listings.length,
        categories: categories.length,
        deliveryMethods,
      },
      listings,
      categories,
    });
  } catch (error) {
    console.error("Seller shop error:", error);
    return res.status(500).json({
      message: "Server error fetching seller shop",
    });
  }
});

router.patch("/orders/:orderId/status", authMiddleware, async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { orderId } = req.params;
    const { status } = req.body;

    if (!VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const sellerOrderItem = await prisma.orderItem.findFirst({
      where: {
        orderId,
        product: {
          sellerId,
        },
      },
      include: {
        order: true,
        product: true,
      },
    });

    if (!sellerOrderItem) {
      return res.status(404).json({
        message: "Order not found for this seller",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return res.json({
      message: "Order status updated",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update seller order status error:", error);
    return res.status(500).json({
      message: "Server error updating order status",
    });
  }
});

module.exports = router;