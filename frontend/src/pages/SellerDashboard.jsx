import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { sellerService } from "../services/sellerService";

export default function SellerDashboard() {
  const [dashboard, setDashboard] = useState({
    stats: {
      activeListings: 0,
      ordersReceived: 0,
      totalRevenue: 0,
      lowStockItems: 0,
    },
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data = await sellerService.getDashboard();
        setDashboard(data);
      } catch (err) {
        setError(err.message || "Failed to load seller dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

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
    <div className="min-h-screen bg-sky-50">
      <Navbar />

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
          <div className="mt-10 rounded-2xl bg-white p-8 shadow-md text-slate-600">
            Loading dashboard...
          </div>
        ) : error ? (
          <div className="mt-10 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <>
            <section className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white p-6 shadow-md">
                  <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                  <p className="mt-3 text-3xl font-black text-slate-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </section>

            <section className="mt-10 rounded-2xl bg-white p-8 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Recent Orders</h2>
                  <p className="mt-1 text-slate-500">
                    Latest purchases from your customers
                  </p>
                </div>
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
                        <tr key={order.id} className="border-b border-slate-100">
                          <td className="py-4 font-semibold text-slate-900">{order.id}</td>
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

      <Footer />
    </div>
  );
}