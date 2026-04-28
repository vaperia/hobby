import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

function formatStatus(status) {
  if (!status) return "Pending";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString();
}

function formatShippingMethod(method) {
  if (method === "SELF_COLLECTION") return "Self Collection";
  if (method === "STANDARD_DELIVERY") return "Standard Delivery";
  return "";
}

export default function TopBar() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const isSeller = user?.role === "seller" || user?.role === "admin";

  async function loadNotifications() {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    setNotificationsLoading(true);
    setNotificationsError("");

    try {
      if (isSeller) {
        const data = await api.get("/seller/dashboard");

        const orderNotifications = (data.recentOrders || []).map((order) => ({
          id: `seller-order-${order.orderItemId || order.id}`,
          title: "Seller order update",
          message: `${order.buyer || "Buyer"} ordered ${
            order.item || "a product"
          }${order.quantity ? ` x ${order.quantity}` : ""}. Status: ${formatStatus(
            order.status
          )}.`,
          subtext: `${formatShippingMethod(order.shippingMethod)} ${
            order.createdAt ? `• ${formatDate(order.createdAt)}` : ""
          }`,
          link: "/seller/orders",
          createdAt: order.createdAt,
        }));

        const lowStockNotifications = (data.listings || [])
          .filter((listing) => {
            const stock = Number(listing.stock || 0);
            return stock > 0 && stock <= 5;
          })
          .map((listing) => ({
            id: `low-stock-${listing.id}`,
            title: "Low stock alert",
            message: `${listing.title || "Product"} only has ${
              listing.stock
            } left.`,
            subtext: "Restock soon",
            link: "/seller",
            createdAt: listing.createdAt,
          }));

        const combinedNotifications = [
          ...orderNotifications,
          ...lowStockNotifications,
        ]
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 5);

        setNotifications(combinedNotifications);
      } else {
        const orders = await api.get("/orders");

        const buyerNotifications = (Array.isArray(orders) ? orders : [])
          .map((order) => ({
            id: `buyer-order-${order.id}`,
            title: `Order ${formatStatus(order.status)}`,
            message: `Your order ${order.id} is currently ${formatStatus(
              order.status
            )}.`,
            subtext: `$${Number(order.totalAmount || 0).toFixed(2)} ${
              order.createdAt ? `• ${formatDate(order.createdAt)}` : ""
            }`,
            link: "/orders",
            createdAt: order.updatedAt || order.createdAt,
          }))
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 5);

        setNotifications(buyerNotifications);
      }
    } catch (err) {
      console.error("Load notifications error:", err);
      setNotificationsError(err.message || "Failed to load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function handleToggleNotifications() {
    const nextOpenState = !notificationsOpen;

    setNotificationsOpen(nextOpenState);

    if (nextOpenState) {
      await loadNotifications();
    }
  }

  function handleNotificationClick(link) {
    setNotificationsOpen(false);
    navigate(link);
  }

  return (
    <div className="bg-gradient-to-r from-purple-700 via-red-600 to-sky-500 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs">
        <div className="flex items-center gap-4">
          {isAuthenticated && isSeller ? (
            <>
              <Link to="/seller" className="hover:text-orange-200">
                Seller Centre
              </Link>

              <Link to="/seller/shop" className="hover:text-orange-200">
                My Shop
              </Link>

              <Link to="/seller/orders" className="hover:text-orange-200">
                Seller Orders
              </Link>

              <Link to="/seller/reports" className="hover:text-orange-200">
                Sales Report
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="hover:text-orange-200">
                Seller Centre
              </Link>

              <Link to="/register" className="hover:text-orange-200">
                Start Selling
              </Link>
            </>
          )}

          <Link to="/" className="hover:text-orange-200">
            Download
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <div className="relative">
              <button
                type="button"
                onClick={handleToggleNotifications}
                className="hover:text-orange-200"
              >
                Notifications
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Latest Updates</h3>

                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-sm text-slate-400 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {notificationsLoading ? (
                      <p className="text-sm text-slate-500">
                        Loading updates...
                      </p>
                    ) : notificationsError ? (
                      <p className="text-sm text-red-600">
                        {notificationsError}
                      </p>
                    ) : notifications.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No updates yet.
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() =>
                            handleNotificationClick(notification.link)
                          }
                          className="w-full rounded-xl border border-slate-100 p-3 text-left transition hover:bg-sky-50"
                        >
                          <p className="text-sm font-bold text-slate-900">
                            {notification.title}
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            {notification.message}
                          </p>

                          {notification.subtext && (
                            <p className="mt-1 text-xs text-slate-400">
                              {notification.subtext}
                            </p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <Link to="/help" className="hover:text-orange-200">
            Help
          </Link>

          {isAuthenticated ? (
            <Link to="/profile" className="font-semibold hover:text-orange-200">
              Hi, {user?.username || user?.name || "User"}
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="font-semibold hover:text-orange-200"
              >
                Sign Up
              </Link>

              <Link to="/login" className="font-semibold hover:text-orange-200">
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}