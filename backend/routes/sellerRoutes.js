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

function getItemTitle(item) {
  return item.product?.title || item.auction?.title || "Item";
}

function getItemImage(item) {
  return item.product?.imageUrl || item.auction?.imageUrl || "";
}

function getItemCategory(item) {
  return item.product?.category || item.auction?.category || "Uncategorized";
}

function getItemSellerId(item) {
  return item.product?.sellerId || item.auction?.sellerId || "";
}

function getItemType(item) {
  return item.auctionId ? "auction" : "product";
}

function formatSellerOrderItem(item) {
  return {
    id: item.order?.id,
    orderItemId: item.id,

    itemType: getItemType(item),

    buyer: item.order?.user?.username || item.order?.user?.email || "Unknown",
    buyerEmail: item.order?.user?.email || "",

    item: getItemTitle(item),

    // Important:
    // Use the actual foreign key from OrderItem first.
    // Do not rely only on item.auction?.id.
    productId: item.productId || item.product?.id || null,
    auctionId: item.auctionId || item.auction?.id || null,

    productImage: getItemImage(item),
    category: getItemCategory(item),

    quantity: item.quantity,
    price: Number(item.price || 0),
    total: Number(item.price || 0) * Number(item.quantity || 0),

    status: item.deliveryStatus || "pending",

    shippingMethod: item.order?.shippingMethod || "",
    shippingFee: Number(item.order?.shippingFee || 0),
    orderTotal: Number(item.order?.totalAmount || 0),

    createdAt: item.order?.createdAt,
    updatedAt: item.updatedAt || item.order?.updatedAt,
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

async function getSellerAuctions(sellerId) {
  return prisma.auction.findMany({
    where: { sellerId },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      category: true,
      condition: true,
      startingBid: true,
      currentBid: true,
      status: true,
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
      OR: [
        {
          product: {
            sellerId,
          },
        },
        {
          auction: {
            sellerId,
          },
        },
      ],
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
          sellerId: true,
        },
      },
      auction: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          category: true,
          sellerId: true,
          currentBid: true,
          status: true,
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

    const [listings, auctions, sellerOrders] = await Promise.all([
      getSellerListings(sellerId),
      getSellerAuctions(sellerId),
      getSellerOrderItems(sellerId),
    ]);

    const totalRevenue = sellerOrders.reduce((sum, item) => {
      if ((item.deliveryStatus || "pending") === "cancelled") return sum;

      return sum + Number(item.price) * Number(item.quantity || 0);
    }, 0);

    const lowStockItems = listings.filter((listing) => {
      const stock = Number(listing.stock || 0);
      return stock > 0 && stock <= 5;
    }).length;

    const pendingOrders = sellerOrders.filter((item) => {
      return [
        "pending",
        "confirmed",
        "preparing",
        "ready_for_collection",
      ].includes(item.deliveryStatus || "pending");
    }).length;

    const completedOrders = sellerOrders.filter((item) => {
      return ["completed", "collected"].includes(item.deliveryStatus || "");
    }).length;

    const recentOrders = sellerOrders.slice(0, 10).map(formatSellerOrderItem);

    return res.json({
      stats: {
        activeListings:
          listings.length + auctions.filter((a) => a.status === "ACTIVE").length,
        ordersReceived: sellerOrders.length,
        totalRevenue,
        lowStockItems,
        pendingOrders,
        completedOrders,
      },
      listings,
      auctions,
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
    const auctions = await getSellerAuctions(sellerId);
    const sellerOrders = await getSellerOrderItems(sellerId);

    const validRevenueOrders = sellerOrders.filter((item) => {
      return (item.deliveryStatus || "pending") !== "cancelled";
    });

    const totalRevenue = validRevenueOrders.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);

    const totalUnitsSold = validRevenueOrders.reduce((sum, item) => {
      return sum + Number(item.quantity || 0);
    }, 0);

    const uniqueOrderIds = new Set(
      sellerOrders.map((item) => item.orderId).filter(Boolean)
    );

    const completedOrders = sellerOrders.filter((item) => {
      return ["completed", "collected"].includes(item.deliveryStatus || "");
    });

    const pendingOrders = sellerOrders.filter((item) => {
      return [
        "pending",
        "confirmed",
        "preparing",
        "ready_for_collection",
      ].includes(item.deliveryStatus || "pending");
    });

    const cancelledOrders = sellerOrders.filter((item) => {
      return (item.deliveryStatus || "pending") === "cancelled";
    });

    const averageOrderValue =
      uniqueOrderIds.size > 0 ? totalRevenue / uniqueOrderIds.size : 0;

    const productMap = {};

    validRevenueOrders.forEach((item) => {
      const itemId = item.product?.id || item.auction?.id || item.id;
      const itemName = getItemTitle(item);
      const itemType = getItemType(item);
      const quantity = Number(item.quantity || 0);
      const revenue = Number(item.price || 0) * quantity;

      if (!productMap[itemId]) {
        productMap[itemId] = {
          productId: itemId,
          productName: itemName,
          itemType,
          unitsSold: 0,
          revenue: 0,
        };
      }

      productMap[itemId].unitsSold += quantity;
      productMap[itemId].revenue += revenue;
    });

    const topProducts = Object.values(productMap).sort((a, b) => {
      return b.revenue - a.revenue;
    });

    const categoryMap = {};

    validRevenueOrders.forEach((item) => {
      const category = getItemCategory(item);
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
        activeListings:
          listings.length + auctions.filter((a) => a.status === "ACTIVE").length,
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
    const auctions = await getSellerAuctions(sellerId);

    const categories = [
      ...new Set(
        [...listings, ...auctions].map((item) => item.category).filter(Boolean)
      ),
    ];

    const deliveryMethods = [
      ...new Set(listings.flatMap((item) => item.deliveryMethods || [])),
    ];

    return res.json({
      seller,
      stats: {
        totalListings: listings.length,
        totalAuctions: auctions.length,
        categories: categories.length,
        deliveryMethods,
      },
      listings,
      auctions,
      categories,
    });
  } catch (error) {
    console.error("Seller shop error:", error);
    return res.status(500).json({
      message: "Server error fetching seller shop",
    });
  }
});

router.patch(
  "/order-items/:orderItemId/status",
  authMiddleware,
  async (req, res) => {
    try {
      const sellerId = req.user.userId;
      const { orderItemId } = req.params;
      const { status } = req.body;

      if (!VALID_ORDER_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Invalid order status",
        });
      }

      const sellerOrderItem = await prisma.orderItem.findUnique({
        where: {
          id: orderItemId,
        },
        include: {
          product: true,
          auction: true,
        },
      });

      if (!sellerOrderItem) {
        return res.status(404).json({
          message: "Order item not found",
        });
      }

      const itemSellerId = getItemSellerId(sellerOrderItem);

      if (itemSellerId !== sellerId) {
        return res.status(403).json({
          message: "You are not authorized to update this order item",
        });
      }

      const updatedOrderItem = await prisma.orderItem.update({
        where: {
          id: orderItemId,
        },
        data: {
          deliveryStatus: status,
        },
        include: {
          product: true,
          auction: true,
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
        },
      });

      return res.json({
        message: "Delivery status updated",
        order: formatSellerOrderItem(updatedOrderItem),
      });
    } catch (error) {
      console.error("Update seller order item status error:", error);
      return res.status(500).json({
        message: "Server error updating delivery status",
      });
    }
  }
);

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

    const sellerOrderItems = await prisma.orderItem.findMany({
      where: {
        orderId,
        OR: [
          {
            product: {
              sellerId,
            },
          },
          {
            auction: {
              sellerId,
            },
          },
        ],
      },
      include: {
        product: true,
        auction: true,
      },
    });

    if (!sellerOrderItems.length) {
      return res.status(404).json({
        message: "Order not found for this seller",
      });
    }

    await prisma.orderItem.updateMany({
      where: {
        id: {
          in: sellerOrderItems.map((item) => item.id),
        },
      },
      data: {
        deliveryStatus: status,
      },
    });

    return res.json({
      message: "Order item statuses updated",
    });
  } catch (error) {
    console.error("Update seller order status error:", error);
    return res.status(500).json({
      message: "Server error updating order status",
    });
  }
});

module.exports = router;