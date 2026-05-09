import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Help from "./pages/Help";
import Auctions from "./pages/Auctions";
import AuctionDetails from "./pages/AuctionDetails";
import CreateAuction from "./pages/CreateAuction";
import EditAuction from "./pages/EditAuction";
import RepostAuction from "./pages/RepostAuction";
import SellerAuctions from "./pages/SellerAuctions";
import SellerDashboard from "./pages/SellerDashboard";
import SellerOrders from "./pages/SellerOrders";
import SellerReports from "./pages/SellerReports";
import SellerShop from "./pages/SellerShop";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import ConvertAuctionToListing from "./pages/ConvertAuctionToListing";
import ConvertListingToAuction from "./pages/ConvertListingToAuction";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/auctions" element={<Auctions />} />
      <Route path="/auctions/:id" element={<AuctionDetails />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/help" element={<Help />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller"
        element={
          <ProtectedRoute allowedRoles={["seller", "admin"]}>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/orders"
        element={
          <ProtectedRoute allowedRoles={["seller", "admin"]}>
            <SellerOrders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/reports"
        element={
          <ProtectedRoute allowedRoles={["seller", "admin"]}>
            <SellerReports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/shop"
        element={
          <ProtectedRoute allowedRoles={["seller", "admin"]}>
            <SellerShop />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/auctions"
        element={
          <ProtectedRoute allowedRoles={["seller", "admin"]}>
            <SellerAuctions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/auctions/new"
        element={
          <ProtectedRoute allowedRoles={["seller", "admin"]}>
            <CreateAuction />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/auctions/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["seller", "admin"]}>
            <EditAuction />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/auctions/:id/repost"
        element={
          <ProtectedRoute allowedRoles={["seller", "admin"]}>
            <RepostAuction />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/auctions/:id/convert-to-listing"
        element={
          <ProtectedRoute allowedRoles={["seller", "admin"]}>
            <ConvertAuctionToListing />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/products/new"
        element={
          <ProtectedRoute allowedRoles={["seller", "admin"]}>
            <CreateListing />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/products/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["seller", "admin"]}>
            <EditListing />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/products/:id/convert-to-auction"
        element={
          <ProtectedRoute allowedRoles={["seller", "admin"]}>
            <ConvertListingToAuction />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}