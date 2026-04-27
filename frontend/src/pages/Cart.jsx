import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { cartService } from "../services/cartService";
import { useAuth } from "../context/AuthContext";

export default function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCart() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await cartService.getCart();
        setCart(data || { items: [] });
      } catch (err) {
        console.error("Load cart error:", err);
        setError(err.message || "Failed to load cart.");
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, [isAuthenticated]);

  const items = cart?.items || [];

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item.price ?? item.product?.price ?? 0);
      return sum + price * Number(item.quantity || 0);
    }, 0);
  }, [items]);

  async function handleQuantityChange(itemId, nextQuantity) {
    if (nextQuantity < 1) return;

    setUpdatingId(itemId);
    setError("");

    try {
      await cartService.updateItem(itemId, nextQuantity);

      setCart((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, quantity: nextQuantity } : item
        ),
      }));
    } catch (err) {
      console.error("Update cart item error:", err);
      setError(err.message || "Failed to update item quantity.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemoveItem(itemId) {
    setUpdatingId(itemId);
    setError("");

    try {
      await cartService.removeItem(itemId);

      setCart((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));
    } catch (err) {
      console.error("Remove cart item error:", err);
      setError(err.message || "Failed to remove item.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleClearCart() {
    setError("");

    try {
      await cartService.clearCart();
      setCart({ items: [] });
    } catch (err) {
      console.error("Clear cart error:", err);
      setError(err.message || "Failed to clear cart.");
    }
  }

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-4xl font-black text-slate-900">Your Cart</h1>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-600">
              Please log in to view and manage your cart.
            </p>

            <div className="mt-6 flex gap-4">
              <Link
                to="/login"
                className="rounded-2xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950"
              >
                Login
              </Link>

              <Link
                to="/products"
                className="rounded-2xl border border-slate-300 px-6 py-3 font-semibold text-slate-700"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900">Your Cart</h1>

            <p className="mt-2 text-slate-500">
              Review your items before checkout
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100"
            >
              Clear Cart
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-600">
            Loading cart...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-600">Your cart is empty for now.</p>

            <Link
              to="/products"
              className="mt-6 inline-block rounded-2xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <section className="space-y-4">
              {items.map((item) => {
                const product = item.product || {};
                const itemName =
                  product.title || product.name || item.name || "Product";

                const itemImage =
                  product.imageUrl ||
                  product.image_url ||
                  product.image ||
                  item.imageUrl ||
                  item.image ||
                  "";

                const itemPrice = Number(item.price ?? product.price ?? 0);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      {itemImage ? (
                        <img
                          src={itemImage}
                          alt={itemName}
                          className="h-32 w-32 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">
                          No image
                        </div>
                      )}

                      <div className="flex flex-1 flex-col justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">
                            {itemName}
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            ${itemPrice.toFixed(2)} each
                          </p>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity - 1)
                              }
                              disabled={
                                updatingId === item.id || item.quantity <= 1
                              }
                              className="h-10 w-10 rounded-md border border-slate-300 text-lg font-bold text-slate-700 disabled:opacity-50"
                            >
                              -
                            </button>

                            <span className="min-w-[24px] text-center font-semibold text-slate-900">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity + 1)
                              }
                              disabled={updatingId === item.id}
                              className="h-10 w-10 rounded-md border border-slate-300 text-lg font-bold text-slate-700 disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center gap-4">
                            <p className="font-bold text-slate-900">
                              ${(itemPrice * item.quantity).toFixed(2)}
                            </p>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={updatingId === item.id}
                              className="text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Summary</h2>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Items</span>
                  <span>{items.length}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="mt-6 w-full rounded-2xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950"
              >
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </main>
    </PageLayout>
  );
}