import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { cartService } from "../services/cartService";
import { useAuth } from "../context/AuthContext";

const DEFAULT_DELIVERY_METHODS = ["SELF_COLLECTION", "STANDARD_DELIVERY"];

function getProductDeliveryMethods(product) {
  if (!product) return DEFAULT_DELIVERY_METHODS;
  return product.deliveryMethods || product.delivery_methods || DEFAULT_DELIVERY_METHODS;
}

function getShippingMethodLabel(method) {
  if (method === "SELF_COLLECTION") return "Self Collection";
  if (method === "STANDARD_DELIVERY") return "Standard Delivery";
  return "";
}

export default function Checkout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    country: "Singapore",
    shippingMethod: "",
  });

  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        console.error("Checkout cart load error:", err);
        setError(err.message || "Failed to load checkout cart.");
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, [isAuthenticated]);

  const cartItems = cart?.items || [];

  const availableShippingMethods = useMemo(() => {
    if (cartItems.length === 0) return [];

    const methodSets = cartItems.map((item) => {
      return getProductDeliveryMethods(item.product);
    });

    return methodSets.reduce((commonMethods, methods) => {
      return commonMethods.filter((method) => methods.includes(method));
    }, DEFAULT_DELIVERY_METHODS);
  }, [cartItems]);

  useEffect(() => {
    if (availableShippingMethods.length === 1 && !form.shippingMethod) {
      setForm((prev) => ({
        ...prev,
        shippingMethod: availableShippingMethods[0],
      }));
    }

    if (
      form.shippingMethod &&
      !availableShippingMethods.includes(form.shippingMethod)
    ) {
      setForm((prev) => ({
        ...prev,
        shippingMethod: "",
      }));
    }
  }, [availableShippingMethods, form.shippingMethod]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = Number(item.price ?? item.product?.price ?? 0);
      const quantity = Number(item.quantity || 0);

      return sum + price * quantity;
    }, 0);
  }, [cartItems]);

  const shippingFee =
    form.shippingMethod === "STANDARD_DELIVERY"
      ? subtotal > 100
        ? 0
        : 5.99
      : 0;

  const total = subtotal + shippingFee;
  const isStandardDelivery = form.shippingMethod === "STANDARD_DELIVERY";

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!form.shippingMethod) {
      setError("Please select a shipping method.");
      return;
    }

    if (isStandardDelivery && (!form.addressLine1 || !form.postalCode)) {
      setError("Please enter your delivery address and postal code.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const orderData = {
        customer: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
        },
        shippingAddress: isStandardDelivery
          ? {
              addressLine1: form.addressLine1,
              addressLine2: form.addressLine2,
              postalCode: form.postalCode,
              country: form.country,
            }
          : null,
        shippingMethod: form.shippingMethod,
        subtotal,
        shippingFee,
        total,
      };

      await cartService.checkout(orderData);
      alert("Checkout successful.");
      navigate("/orders");
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-4xl font-black text-slate-900">Checkout</h1>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-600">Please log in before checking out.</p>

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
      <main className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-4xl font-black text-slate-900">Checkout</h1>

        <p className="mt-2 text-slate-500">
          Review your order and fill in your shipping details
        </p>

        {loading ? (
          <div className="py-16 text-center text-slate-600">
            Loading checkout...
          </div>
        ) : cartItems.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <p className="text-slate-600">Your cart is empty.</p>

            <Link
              to="/products"
              className="mt-6 inline-block rounded-2xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl bg-white p-8 shadow-md"
            >
              <h2 className="text-2xl font-bold text-slate-900">
                Shipping Information
              </h2>

              {error && (
                <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>

                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>

                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    type="email"
                    placeholder="Enter your email"
                    className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone
                  </label>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    type="text"
                    placeholder="Enter your phone number"
                    className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Shipping Method
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  {availableShippingMethods.includes("SELF_COLLECTION") && (
                    <label className="cursor-pointer rounded-xl border border-slate-300 p-4 hover:border-sky-500">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="SELF_COLLECTION"
                        checked={form.shippingMethod === "SELF_COLLECTION"}
                        onChange={handleChange}
                        required
                        className="mr-2"
                      />

                      <span className="font-semibold text-slate-900">
                        Self Collection
                      </span>

                      <p className="mt-1 text-sm text-slate-500">
                        Collect directly from the seller.
                      </p>
                    </label>
                  )}

                  {availableShippingMethods.includes("STANDARD_DELIVERY") && (
                    <label className="cursor-pointer rounded-xl border border-slate-300 p-4 hover:border-sky-500">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="STANDARD_DELIVERY"
                        checked={form.shippingMethod === "STANDARD_DELIVERY"}
                        onChange={handleChange}
                        required
                        className="mr-2"
                      />

                      <span className="font-semibold text-slate-900">
                        Standard Delivery
                      </span>

                      <p className="mt-1 text-sm text-slate-500">
                        Ship the item to your address.
                      </p>
                    </label>
                  )}
                </div>

                {availableShippingMethods.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    No delivery method is available for all items in your cart.
                  </p>
                )}
              </div>

              {isStandardDelivery && (
                <>
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Address Line 1
                    </label>

                    <input
                      name="addressLine1"
                      value={form.addressLine1}
                      onChange={handleChange}
                      required={isStandardDelivery}
                      type="text"
                      placeholder="Street address"
                      className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Address Line 2
                    </label>

                    <input
                      name="addressLine2"
                      value={form.addressLine2}
                      onChange={handleChange}
                      type="text"
                      placeholder="Unit, building, optional"
                      className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Postal Code
                      </label>

                      <input
                        name="postalCode"
                        value={form.postalCode}
                        onChange={handleChange}
                        required={isStandardDelivery}
                        type="text"
                        placeholder="Enter postal code"
                        className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Country
                      </label>

                      <input
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        required={isStandardDelivery}
                        type="text"
                        className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {form.shippingMethod === "SELF_COLLECTION" && (
                <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-600">
                  You selected self collection. The seller will arrange collection
                  details after the order is placed.
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || availableShippingMethods.length === 0}
                className="mt-8 w-full rounded-md bg-gradient-to-r from-purple-700 via-blue-600 to-orange-500 py-3 font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Processing..." : "Proceed to Payment"}
              </button>
            </form>

            <aside className="h-fit rounded-2xl bg-white p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                {cartItems.map((item) => {
                  const product = item.product || {};

                  const itemName =
                    product.title || product.name || item.name || "Product";

                  const itemPrice = Number(item.price ?? product.price ?? 0);
                  const itemQuantity = Number(item.quantity || 0);

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {itemName}
                        </p>

                        <p className="text-sm text-slate-500">
                          Qty: {itemQuantity}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Available:{" "}
                          {getProductDeliveryMethods(product)
                            .map(getShippingMethodLabel)
                            .join(", ")}
                        </p>
                      </div>

                      <p className="font-semibold text-slate-900">
                        ${(itemPrice * itemQuantity).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>
                    Shipping{" "}
                    {form.shippingMethod
                      ? `(${getShippingMethodLabel(form.shippingMethod)})`
                      : ""}
                  </span>
                  <span>
                    {shippingFee === 0 ? "Free" : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-4 text-base font-bold text-slate-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </PageLayout>
  );
}