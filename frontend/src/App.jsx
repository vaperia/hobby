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
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/auctions" element={<Auctions />} />
      <Route path="/auctions/:id" element={<AuctionDetails />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/help" element={<Help />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Logged-in user pages */}
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

      {/* All logged-in users can create listings / auctions */}
      <Route
        path="/create-listing"
        element={
          <ProtectedRoute>
            <CreateListing />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-auction"
        element={
          <ProtectedRoute>
            <CreateAuction />
          </ProtectedRoute>
        }
      />

      {/* Old seller-style links kept working, but they now go to the profile dashboard */}
      <Route
        path="/seller/auctions"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/auctions/new"
        element={
          <ProtectedRoute>
            <CreateAuction />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/products/new"
        element={
          <ProtectedRoute>
            <CreateListing />
          </ProtectedRoute>
        }
      />

      {/* Owner-only protection is handled by backend */}
      <Route
        path="/seller/auctions/:id/edit"
        element={
          <ProtectedRoute>
            <EditAuction />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/auctions/:id/repost"
        element={
          <ProtectedRoute>
            <RepostAuction />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/auctions/:id/convert-to-listing"
        element={
          <ProtectedRoute>
            <ConvertAuctionToListing />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/products/:id/edit"
        element={
          <ProtectedRoute>
            <EditListing />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/products/:id/convert-to-auction"
        element={
          <ProtectedRoute>
            <ConvertListingToAuction />
          </ProtectedRoute>
        }
      />

      {/* Shop seller/admin only pages */}
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
    </Routes>
  );
}