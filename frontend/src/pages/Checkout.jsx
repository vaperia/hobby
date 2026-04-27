import { useMemo, useState } from "react";
import PageLayout from "../components/PageLayout";

export default function Checkout() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    country: "Singapore",
  });

  const [cartItems] = useState([
    { id: 1, name: "Sample TCG Booster Box", price: 49.9, quantity: 1 },
    { id: 2, name: "Collector Figurine", price: 89.9, quantity: 1 },
  ]);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
  }, [cartItems]);

  const shippingFee = subtotal > 100 ? 0 : 5.99;
  const total = subtotal + shippingFee;

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log("Checkout form submitted:", form);
  }

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-4xl font-black text-slate-900">Checkout</h1>

        <p className="mt-2 text-slate-500">
          Review your order and fill in your shipping details
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-8 shadow-md"
          >
            <h2 className="text-2xl font-bold text-slate-900">
              Shipping Information
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Full Name
                </label>

                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
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
                  type="text"
                  placeholder="Enter your phone number"
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Postal Code
                </label>

                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  type="text"
                  placeholder="Enter postal code"
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Address Line 1
              </label>

              <input
                name="addressLine1"
                value={form.addressLine1}
                onChange={handleChange}
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

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Country
              </label>

              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                type="text"
                className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              className="mt-8 w-full rounded-md bg-gradient-to-r from-purple-700 via-blue-600 to-orange-500 py-3 font-semibold text-white hover:opacity-95"
            >
              Proceed to Payment
            </button>
          </form>

          <aside className="rounded-2xl bg-white p-8 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900">Order Summary</h2>

            <div className="mt-6 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>

                    <p className="text-sm text-slate-500">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <p className="font-semibold text-slate-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
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
      </main>
    </PageLayout>
  );
}