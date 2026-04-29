require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const auctionRoutes = require("./routes/auctionRoutes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});