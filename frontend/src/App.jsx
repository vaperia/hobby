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
import SellerDashboard from "./pages/SellerDashboard";
import SellerOrders from "./pages/SellerOrders";
import SellerReports from "./pages/SellerReports";
import SellerShop from "./pages/SellerShop";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetails />} />
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
    </Routes>
  );
}