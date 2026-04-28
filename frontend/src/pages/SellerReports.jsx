import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { sellerService } from "../services/sellerService";

const ORDER_STATUS_OPTIONS = [
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

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
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

  async function handleUpdateOrderStatus(orderId, status) {
    if (!orderId) return;

    try {
      setUpdatingOrderId(orderId);
      setError("");
      setMessage("");

      await sellerService.updateOrderStatus(orderId, status);

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      setMessage("Order status updated successfully.");
    } catch (err) {
      console.error("Update order status error:", err);
      setError(err.message || "Failed to update order status.");
    } finally {
      setUpdatingOrderId("");
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
              Manage customer orders and update fulfillment status.
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
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700"
            }`}
          >
            All
          </button>

          {ORDER_STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() => setFilter(status.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                filter === status.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700"
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
              <table className="w-full min-w-[1000px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                    <th className="pb-3 font-semibold">Order</th>
                    <th className="pb-3 font-semibold">Buyer</th>
                    <th className="pb-3 font-semibold">Product</th>
                    <th className="pb-3 font-semibold">Delivery</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Total</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Update</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={`${order.id}-${order.orderItemId}`}
                      className="border-b border-slate-100"
                    >
                      <td className="py-4 pr-4 font-semibold text-slate-900">
                        {order.id}
                      </td>

                      <td className="py-4 text-slate-700">
                        <p className="font-semibold">{order.buyer}</p>
                        <p className="text-xs text-slate-400">
                          {order.buyerEmail}
                        </p>
                      </td>

                      <td className="py-4 text-slate-700">
                        <div className="flex items-center gap-3">
                          {order.productImage ? (
                            <img
                              src={order.productImage}
                              alt={order.item}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                              No Image
                            </div>
                          )}

                          <div>
                            <p className="font-semibold">{order.item}</p>
                            <p className="text-xs text-slate-400">
                              Qty: {order.quantity}
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

                      <td className="py-4 font-semibold text-blue-600">
                        {formatStatus(order.status)}
                      </td>

                      <td className="py-4">
                        <select
                          value={order.status || "pending"}
                          disabled={updatingOrderId === order.id}
                          onChange={(e) =>
                            handleUpdateOrderStatus(order.id, e.target.value)
                          }
                          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {ORDER_STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </PageLayout>
  );
}