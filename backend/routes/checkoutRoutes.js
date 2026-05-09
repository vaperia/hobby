const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const VALID_DELIVERY_METHODS = ["SELF_COLLECTION", "STANDARD_DELIVERY"];

function getCartItemPrice(item) {
  return Number(
    item.price ??
      item.product?.price ??
      item.auction?.currentBid ??
      item.auction?.startingBid ??
      0
  );
}

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { shippingMethod, shippingFee = 0 } = req.body;

    if (!shippingMethod) {
      return res.status(400).json({
        message: "Shipping method is required",
      });
    }

    if (!VALID_DELIVERY_METHODS.includes(shippingMethod)) {
      return res.status(400).json({
        message: "Invalid shipping method",
      });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.userId },
      include: {
        product: true,
        auction: true,
      },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const unavailableItem = cartItems.find((item) => {
      if (item.product) {
        const productDeliveryMethods = item.product.deliveryMethods || [
          "SELF_COLLECTION",
          "STANDARD_DELIVERY",
        ];

        return !productDeliveryMethods.includes(shippingMethod);
      }

      return false;
    });

    if (unavailableItem) {
      return res.status(400).json({
        message: `${unavailableItem.product.title} does not support the selected shipping method`,
      });
    }

    const invalidAuctionItem = cartItems.find((item) => {
      if (!item.auction) return false;

      return (
        item.auction.status !== "AWAITING_PAYMENT" ||
        item.auction.winnerId !== req.user.userId
      );
    });

    if (invalidAuctionItem) {
      return res.status(400).json({
        message:
          "One of your auction items is no longer available for payment.",
      });
    }

    const subtotal = cartItems.reduce((sum, item) => {
      return sum + Number(item.quantity || 1) * getCartItemPrice(item);
    }, 0);

    const safeShippingFee =
      shippingMethod === "STANDARD_DELIVERY" ? Number(shippingFee || 0) : 0;

    const totalAmount = subtotal + safeShippingFee;

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId: req.user.userId,
          totalAmount,
          shippingMethod,
          shippingFee: safeShippingFee,
          status: "pending",
        },
      });

      for (const item of cartItems) {
        if (item.productId && item.product) {
          await tx.orderItem.create({
            data: {
              orderId: createdOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              price: Number(item.product.price),
              deliveryStatus: "pending",
            },
          });

          await tx.listing.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        if (item.auctionId && item.auction) {
          const auctionPrice = getCartItemPrice(item);

          await tx.orderItem.create({
            data: {
              orderId: createdOrder.id,
              auctionId: item.auctionId,
              quantity: 1,
              price: auctionPrice,
              deliveryStatus: "pending",
            },
          });

          await tx.auction.update({
            where: { id: item.auctionId },
            data: {
              status: "PAID",
              paidAt: new Date(),
            },
          });
        }
      }

      await tx.cartItem.deleteMany({
        where: { userId: req.user.userId },
      });

      return createdOrder;
    });

    res.status(201).json({
      message: "Checkout successful",
      order,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ message: "Server error during checkout" });
  }
});

module.exports = router;