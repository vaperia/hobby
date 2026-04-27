import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { sellerService } from "../services/sellerService";
import { productService } from "../services/productService";

export default function SellerDashboard() {
  const [dashboard, setDashboard] = useState({
    stats: {
      activeListings: 0,
      ordersReceived: 0,
      totalRevenue: 0,
      lowStockItems: 0,
    },
    listings: [],
    recentOrders: [],
  });

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

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

      await productService.remove(id);
      await loadDashboard();
    } catch (err) {
      console.error("Delete listing error:", err);
      setError(err.message || "Failed to delete listing.");
    } finally {
      setDeletingId("");
    }
  }

  const stats = [
    {
      label: "Active Listings",
      value: dashboard.stats?.activeListings ?? 0,
    },
    {
      label: "Orders Received",
      value: dashboard.stats?.ordersReceived ?? 0,
    },
    {
      label: "Total Revenue",
      value: `$${Number(dashboard.stats?.totalRevenue ?? 0).toFixed(2)}`,
    },
    {
      label: "Low Stock Items",
      value: dashboard.stats?.lowStockItems ?? 0,
    },
  ];

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900">
              Seller Dashboard
            </h1>

            <p className="mt-2 text-slate-500">
              Manage your listings, orders, and shop performance
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
            Loading dashboard...
          </div>
        ) : (
          <>
            {error && (
              <div className="mt-10 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <section className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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

            <section className="mt-10 rounded-2xl bg-white p-8 shadow-md">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    My Listings
                  </h2>

                  <p className="mt-1 text-slate-500">
                    View and edit products you have listed
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
                          listing.title || listing.name || "Unnamed Product";

                        return (
                          <tr
                            key={listing.id}
                            className="border-b border-slate-100"
                          >
                            <td className="py-4">
                              <div className="flex items-center gap-4">
                                {listing.imageUrl ? (
                                  <img
                                    src={listing.imageUrl}
                                    alt={productName}
                                    className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                                    No image
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

            <section className="mt-10 rounded-2xl bg-white p-8 shadow-md">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Recent Orders
                </h2>

                <p className="mt-1 text-slate-500">
                  Latest purchases from your customers
                </p>
              </div>

              <div className="mt-6 overflow-x-auto">
                {dashboard.recentOrders?.length === 0 ? (
                  <p className="text-slate-600">No recent orders yet.</p>
                ) : (
                  <table className="w-full min-w-[700px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                        <th className="pb-3 font-semibold">Order ID</th>
                        <th className="pb-3 font-semibold">Buyer</th>
                        <th className="pb-3 font-semibold">Item</th>
                        <th className="pb-3 font-semibold">Total</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboard.recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-slate-100"
                        >
                          <td className="py-4 font-semibold text-slate-900">
                            {order.id}
                          </td>

                          <td className="py-4 text-slate-700">
                            {order.buyer || "Unknown"}
                          </td>

                          <td className="py-4 text-slate-700">
                            {order.item || "Product"}
                          </td>

                          <td className="py-4 text-slate-700">
                            ${Number(order.total || 0).toFixed(2)}
                          </td>

                          <td className="py-4 font-semibold text-blue-600">
                            {order.status}
                          </td>
                        </tr>
                      ))}
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