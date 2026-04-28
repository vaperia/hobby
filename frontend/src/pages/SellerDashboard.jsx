import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { sellerService } from "../services/sellerService";
import { productService } from "../services/productService";

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

function getNextOrderStatus(order) {
  const status = order.status || "pending";
  const shippingMethod = order.shippingMethod;

  if (status === "cancelled" || status === "completed" || status === "collected") {
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

export default function SellerDashboard() {
  const [dashboard, setDashboard] = useState({
    stats: {
      activeListings: 0,
      ordersReceived: 0,
      totalRevenue: 0,
      lowStockItems: 0,
      pendingOrders: 0,
      completedOrders: 0,
    },
    listings: [],
    recentOrders: [],
  });

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const data = await sellerService.getDashboard();

      setDashboard({
        stats: data.stats || {
          activeListings: 0,
          ordersReceived: 0,
          totalRevenue: 0,
          lowStockItems: 0,
          pendingOrders: 0,
          completedOrders: 0,
        },
        listings: data.listings || [],
        recentOrders: data.recentOrders || [],
      });
    } catch (err) {
      console.error("Load seller dashboard error:", err);
      setError(err.message || "Failed to load seller dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleDeleteListing(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      await productService.remove(id);
      await loadDashboard();

      setMessage("Listing deleted successfully.");
    } catch (err) {
      console.error("Delete listing error:", err);
      setError(err.message || "Failed to delete listing.");
    } finally {
      setDeletingId("");
    }
  }

  async function handleUpdateOrderStatus(orderId, status) {
    if (!orderId || !status) return;

    try {
      setUpdatingOrderId(orderId);
      setError("");
      setMessage("");

      await sellerService.updateOrderStatus(orderId, status);

      setDashboard((prev) => ({
        ...prev,
        recentOrders: prev.recentOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        ),
      }));

      setMessage(`Order updated to ${formatStatus(status)}.`);
    } catch (err) {
      console.error("Update order status error:", err);
      setError(err.message || "Failed to update order status.");
    } finally {
      setUpdatingOrderId("");
    }
  }

  const stats = [
    {
      label: "Estimated Revenue",
      value: `$${Number(dashboard.stats?.totalRevenue ?? 0).toFixed(2)}`,
    },
    {
      label: "Orders Received",
      value: dashboard.stats?.ordersReceived ?? 0,
    },
    {
      label: "Active Listings",
      value: dashboard.stats?.activeListings ?? 0,
    },
    {
      label: "Low Stock Items",
      value: dashboard.stats?.lowStockItems ?? 0,
    },
    {
      label: "Pending Orders",
      value: dashboard.stats?.pendingOrders ?? 0,
    },
    {
      label: "Completed Orders",
      value: dashboard.stats?.completedOrders ?? 0,
    },
  ];

  const quickActions = [
    {
      title: "Manage Orders",
      description: "View all customer orders and update order status.",
      link: "/seller/orders",
    },
    {
      title: "Sales Report",
      description: "Check revenue, top products, and category performance.",
      link: "/seller/reports",
    },
    {
      title: "My Shop",
      description: "Preview your public shop and product listings.",
      link: "/seller/shop",
    },
    {
      title: "Create Listing",
      description: "Add a new product to your shop.",
      link: "/seller/products/new",
    },
  ];

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900">
              Seller Centre
            </h1>

            <p className="mt-2 text-slate-500">
              Manage listings, customer orders, revenue reports, and shop
              performance.
            </p>
          </div>

          <Link
            to="/seller/products/new"
            className="inline-flex rounded-md bg-gradient-to-r from-purple-700 via-blue-600 to-orange-500 px-5 py-3 font-semibold text-white hover:opacity-95"
          >
            Create New Listing
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 rounded-2xl bg-white p-8 text-slate-600 shadow-md">
            Loading seller centre...
          </div>
        ) : (
          <>
            {error && (
              <div className="mt-10 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-10 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            <section className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white p-6 shadow-md"
                >
                  <p className="text-sm font-semibold text-slate-500">
                    {stat.label}
                  </p>

                  <p className="mt-3 text-3xl font-black text-slate-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </section>

            <section className="mt-10">
              <h2 className="text-2xl font-bold text-slate-900">
                Quick Actions
              </h2>

              <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    to={action.link}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <h3 className="text-lg font-bold text-slate-900">
                      {action.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {action.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-10 rounded-2xl bg-white p-8 shadow-md">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Recent Orders
                  </h2>

                  <p className="mt-1 text-slate-500">
                    Latest purchases from your customers.
                  </p>
                </div>

                <Link
                  to="/seller/orders"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  View All Orders
                </Link>
              </div>

              <div className="mt-6 overflow-x-auto">
                {dashboard.recentOrders?.length === 0 ? (
                  <p className="text-slate-600">No recent orders yet.</p>
                ) : (
                  <table className="w-full min-w-[950px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                        <th className="pb-3 font-semibold">Order ID</th>
                        <th className="pb-3 font-semibold">Buyer</th>
                        <th className="pb-3 font-semibold">Item</th>
                        <th className="pb-3 font-semibold">Delivery</th>
                        <th className="pb-3 font-semibold">Total</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboard.recentOrders.map((order) => {
                        const nextStatus = getNextOrderStatus(order);

                        return (
                          <tr
                            key={`${order.id}-${order.orderItemId || order.item}`}
                            className="border-b border-slate-100"
                          >
                            <td className="py-4 pr-4 font-semibold text-slate-900">
                              {order.id}
                            </td>

                            <td className="py-4 text-slate-700">
                              {order.buyer || "Unknown"}
                            </td>

                            <td className="py-4 text-slate-700">
                              {order.item || "Product"}
                              {order.quantity ? ` x ${order.quantity}` : ""}
                            </td>

                            <td className="py-4 text-slate-700">
                              {formatShippingMethod(order.shippingMethod)}
                            </td>

                            <td className="py-4 text-slate-700">
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
                                    disabled={updatingOrderId === order.id}
                                    onClick={() =>
                                      handleUpdateOrderStatus(
                                        order.id,
                                        nextStatus
                                      )
                                    }
                                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {updatingOrderId === order.id
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
                                    disabled={updatingOrderId === order.id}
                                    onClick={() =>
                                      handleUpdateOrderStatus(
                                        order.id,
                                        "cancelled"
                                      )
                                    }
                                    className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="mt-10 rounded-2xl bg-white p-8 shadow-md">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    My Listings
                  </h2>

                  <p className="mt-1 text-slate-500">
                    View and edit products you have listed.
                  </p>
                </div>

                <Link
                  to="/seller/products/new"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Add Listing
                </Link>
              </div>

              <div className="mt-6 overflow-x-auto">
                {dashboard.listings?.length === 0 ? (
                  <p className="text-slate-600">
                    You have not created any listings yet.
                  </p>
                ) : (
                  <table className="w-full min-w-[900px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                        <th className="pb-3 font-semibold">Product</th>
                        <th className="pb-3 font-semibold">Category</th>
                        <th className="pb-3 font-semibold">Price</th>
                        <th className="pb-3 font-semibold">Stock</th>
                        <th className="pb-3 font-semibold">Condition</th>
                        <th className="pb-3 font-semibold">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboard.listings.map((listing) => {
                        const productName =
                          listing.title || listing.name || "Product";

                        return (
                          <tr
                            key={listing.id}
                            className="border-b border-slate-100"
                          >
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-3">
                                {listing.imageUrl ? (
                                  <img
                                    src={listing.imageUrl}
                                    alt={productName}
                                    className="h-14 w-14 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                                    No Image
                                  </div>
                                )}

                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {productName}
                                  </p>

                                  <p className="line-clamp-1 text-sm text-slate-500">
                                    {listing.description || "No description"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 text-slate-700">
                              {listing.category || "-"}
                            </td>

                            <td className="py-4 font-semibold text-slate-900">
                              ${Number(listing.price || 0).toFixed(2)}
                            </td>

                            <td className="py-4 text-slate-700">
                              {listing.stock ?? 0}
                            </td>

                            <td className="py-4 text-slate-700">
                              {listing.condition || "-"}
                            </td>

                            <td className="py-4">
                              <div className="flex gap-2">
                                <Link
                                  to={`/products/${listing.id}`}
                                  className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                                >
                                  View
                                </Link>

                                <Link
                                  to={`/seller/products/${listing.id}/edit`}
                                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                  Edit
                                </Link>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteListing(listing.id)
                                  }
                                  disabled={deletingId === listing.id}
                                  className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {deletingId === listing.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </PageLayout>
  );
}