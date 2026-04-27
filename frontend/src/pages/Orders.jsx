import { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import { orderService } from "../services/orderService";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const data = await orderService.getMyOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Load orders error:", err);
        setError(err.message || "Failed to load orders.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <PageLayout>
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-4xl font-black text-slate-900">My Orders</h1>

        <p className="mt-2 text-slate-500">
          Track your purchases and order history
        </p>

        {loading ? (
          <div className="mt-10 rounded-2xl bg-white p-8 shadow-md">
            <p className="text-slate-600">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="mt-10 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            {orders.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 shadow-md">
                <p className="text-slate-600">You have no orders yet.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-white p-8 shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Order ID
                      </p>

                      <p className="text-lg font-bold text-slate-900">
                        {order.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Date
                      </p>

                      <p className="text-slate-900">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Status
                      </p>

                      <p className="font-semibold text-blue-600">
                        {order.status || "pending"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Total
                      </p>

                      <p className="font-bold text-slate-900">
                        ${Number(order.totalAmount || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-200 pt-4">
                    <p className="text-sm font-semibold text-slate-500">
                      Items
                    </p>

                    <ul className="mt-2 space-y-1 text-slate-700">
                      {(order.items || []).map((item) => (
                        <li key={item.id}>
                          • {item.product?.title || "Product"} x{" "}
                          {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </PageLayout>
  );
}