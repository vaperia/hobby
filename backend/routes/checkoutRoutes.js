const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const VALID_DELIVERY_METHODS = ["SELF_COLLECTION", "STANDARD_DELIVERY"];

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
      },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const unavailableItem = cartItems.find((item) => {
      const productDeliveryMethods = item.product.deliveryMethods || [
        "SELF_COLLECTION",
        "STANDARD_DELIVERY",
      ];

      return !productDeliveryMethods.includes(shippingMethod);
    });

    if (unavailableItem) {
      return res.status(400).json({
        message: `${unavailableItem.product.title} does not support the selected shipping method`,
      });
    }

    const subtotal = cartItems.reduce((sum, item) => {
      return sum + item.quantity * item.product.price;
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
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
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