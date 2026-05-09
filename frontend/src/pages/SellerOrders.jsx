import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { sellerService } from "../services/sellerService";

const API_BASE = "http://localhost:5000/api";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
  { value: "ready_for_collection", label: "Ready for Collection" },
  { value: "collected", label: "Collected" },
  { value: "cancelled", label: "Cancelled" },
];

function formatStatus(status) {
  if (!status) return "Pending";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatShippingMethod(method) {
  if (method === "SELF_COLLECTION") return "Self Collection";
  if (method === "STANDARD_DELIVERY") return "Standard Delivery";
  return "-";
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString();
}

function getNextOrderStatus(order) {
  const status = order.status || "pending";
  const shippingMethod = order.shippingMethod;

  if (
    status === "cancelled" ||
    status === "completed" ||
    status === "collected"
  ) {
    return null;
  }

  if (shippingMethod === "SELF_COLLECTION") {
    const selfCollectionFlow = {
      pending: "confirmed",
      confirmed: "ready_for_collection",
      ready_for_collection: "collected",
    };

    return selfCollectionFlow[status] || null;
  }

  const standardDeliveryFlow = {
    pending: "confirmed",
    confirmed: "preparing",
    preparing: "shipped",
    shipped: "completed",
  };

  return standardDeliveryFlow[status] || null;
}

function getNextStatusButtonLabel(order) {
  const nextStatus = getNextOrderStatus(order);

  const labels = {
    confirmed: "Confirm Order",
    preparing: "Start Preparing",
    shipped: "Mark as Shipped",
    completed: "Mark as Completed",
    ready_for_collection: "Ready for Collection",
    collected: "Mark as Collected",
  };

  return labels[nextStatus] || "Update Status";
}

function canCancelOrder(order) {
  return !["completed", "collected", "cancelled"].includes(order.status);
}

function isCompletedAuctionOrder(order) {
  return (
    order.itemType === "auction" &&
    ["completed", "collected"].includes(order.status)
  );
}

function getAuctionIdFromOrder(order) {
  return order.auctionId || order.itemId || order.productId;
}

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderItemId, setUpdatingOrderItemId] = useState("");
  const [deletingAuctionId, setDeletingAuctionId] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const data = await sellerService.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load seller orders error:", err);
      setError(err.message || "Failed to load seller orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleUpdateOrderStatus(orderItemId, status) {
    if (!orderItemId || !status) return;

    try {
      setUpdatingOrderItemId(orderItemId);
      setError("");
      setMessage("");

      await sellerService.updateOrderStatus(orderItemId, status);

      setOrders((prev) =>
        prev.map((order) =>
          order.orderItemId === orderItemId ? { ...order, status } : order
        )
      );

      setMessage(`Delivery status updated to ${formatStatus(status)}.`);
    } catch (err) {
      console.error("Update delivery status error:", err);
      setError(err.message || "Failed to update delivery status.");
    } finally {
      setUpdatingOrderItemId("");
    }
  }

  async function handleDeleteAuctionPosting(order) {
    const auctionId = getAuctionIdFromOrder(order);

    if (!auctionId) {
      setError("Auction ID not found for this order.");
      return;
    }

    const confirmDelete = window.confirm(
      "Delete this completed auction posting? This will remove the auction listing from your seller auction page."
    );

    if (!confirmDelete) return;

    try {
      setDeletingAuctionId(auctionId);
      setError("");
      setMessage("");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/auctions/${auctionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete auction posting.");
      }

      setMessage("Auction posting deleted successfully.");
      await loadOrders();
    } catch (err) {
      console.error("Delete auction posting error:", err);
      setError(err.message || "Failed to delete auction posting.");
    } finally {
      setDeletingAuctionId("");
    }
  }

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900">
              Seller Orders
            </h1>

            <p className="mt-2 text-slate-500">
              Manage customer orders and update delivery status for normal
              products and auction products.
            </p>
          </div>

          <Link
            to="/seller"
            className="rounded-md bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Back to Seller Centre
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() => setFilter(status.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                filter === status.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 shadow-sm"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-8 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <section className="mt-8 rounded-2xl bg-white p-8 shadow-md">
          {loading ? (
            <p className="text-slate-600">Loading seller orders...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-slate-600">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                    <th className="pb-3 font-semibold">Order</th>
                    <th className="pb-3 font-semibold">Buyer</th>
                    <th className="pb-3 font-semibold">Item</th>
                    <th className="pb-3 font-semibold">Delivery</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Total</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => {
                    const nextStatus = getNextOrderStatus(order);
                    const auctionId = getAuctionIdFromOrder(order);
                    const showDeleteAuctionPosting =
                      isCompletedAuctionOrder(order) && auctionId;

                    return (
                      <tr
                        key={`${order.id}-${order.orderItemId}`}
                        className="border-b border-slate-100"
                      >
                        <td className="py-4 pr-4 font-semibold text-slate-900">
                          {order.id}
                        </td>

                        <td className="py-4 text-slate-700">
                          <p className="font-semibold">
                            {order.buyer || "Unknown"}
                          </p>

                          {order.buyerEmail && (
                            <p className="text-xs text-slate-400">
                              {order.buyerEmail}
                            </p>
                          )}
                        </td>

                        <td className="py-4 text-slate-700">
                          <div className="flex items-center gap-3">
                            {order.productImage ? (
                              <img
                                src={order.productImage}
                                alt={order.item || "Item"}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                                No Image
                              </div>
                            )}

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold">
                                  {order.item || "Item"}
                                </p>

                                {order.itemType === "auction" && (
                                  <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700">
                                    Auction
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-400">
                                Qty: {order.quantity || 1}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 text-slate-700">
                          {formatShippingMethod(order.shippingMethod)}
                        </td>

                        <td className="py-4 text-slate-700">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="py-4 font-semibold text-slate-900">
                          ${Number(order.total || 0).toFixed(2)}
                        </td>

                        <td className="py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${
                              order.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : order.status === "completed" ||
                                  order.status === "collected"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {formatStatus(order.status)}
                          </span>
                        </td>

                        <td className="py-4">
                          <div className="flex flex-col gap-2">
                            {nextStatus ? (
                              <button
                                type="button"
                                disabled={
                                  updatingOrderItemId === order.orderItemId
                                }
                                onClick={() =>
                                  handleUpdateOrderStatus(
                                    order.orderItemId,
                                    nextStatus
                                  )
                                }
                                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {updatingOrderItemId === order.orderItemId
                                  ? "Updating..."
                                  : getNextStatusButtonLabel(order)}
                              </button>
                            ) : (
                              <span className="rounded-md bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-600">
                                No further action
                              </span>
                            )}

                            {canCancelOrder(order) && (
                              <button
                                type="button"
                                disabled={
                                  updatingOrderItemId === order.orderItemId
                                }
                                onClick={() =>
                                  handleUpdateOrderStatus(
                                    order.orderItemId,
                                    "cancelled"
                                  )
                                }
                                className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            )}

                            {showDeleteAuctionPosting && (
                              <button
                                type="button"
                                disabled={deletingAuctionId === auctionId}
                                onClick={() =>
                                  handleDeleteAuctionPosting(order)
                                }
                                className="rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingAuctionId === auctionId
                                  ? "Deleting..."
                                  : "Delete Auction Posting"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </PageLayout>
  );
}