import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const API_BASE = "http://localhost:5000/api";
const DEFAULT_DELIVERY_METHODS = ["SELF_COLLECTION", "STANDARD_DELIVERY"];

function formatDeliveryMethod(method) {
  if (method === "SELF_COLLECTION") return "Self Collection";
  if (method === "STANDARD_DELIVERY") return "Standard Delivery";
  return method;
}

export default function ConvertAuctionToListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [auction, setAuction] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: "1",
    category: "TCG",
    condition: "New",
    deliveryMethods: DEFAULT_DELIVERY_METHODS,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const suggestedPrice = useMemo(() => {
    if (!auction) return "0.00";

    return Number(
      auction.currentBid || auction.buyoutPrice || auction.startingBid || 0
    ).toFixed(2);
  }, [auction]);

  useEffect(() => {
    async function loadAuction() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/auctions/${id}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load auction.");
        }

        const defaultPrice = Number(
          data.currentBid || data.buyoutPrice || data.startingBid || 0
        ).toFixed(2);

        setAuction(data);
        setForm({
          title: data.title || "",
          description: data.description || "",
          price: defaultPrice,
          stock: "1",
          category: data.category || "TCG",
          condition: data.condition || "New",
          deliveryMethods: DEFAULT_DELIVERY_METHODS,
        });
      } catch (err) {
        console.error("Load auction error:", err);
        setError(err.message || "Failed to load auction.");
      } finally {
        setLoading(false);
      }
    }

    loadAuction();
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleDeliveryMethodChange(method) {
    setForm((prev) => {
      const current = prev.deliveryMethods || [];

      const updated = current.includes(method)
        ? current.filter((item) => item !== method)
        : [...current, method];

      return {
        ...prev,
        deliveryMethods: updated,
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.deliveryMethods.length) {
      setError("Please select at least one delivery method.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/auctions/${id}/convert-to-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price: form.price,
          stock: form.stock,
          category: form.category,
          condition: form.condition,
          deliveryMethods: form.deliveryMethods,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to move auction to marketplace."
        );
      }

      navigate("/seller/shop");
    } catch (err) {
      console.error("Convert auction error:", err);
      setError(err.message || "Failed to move auction to marketplace.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-2xl bg-white p-8 shadow-md">
            Loading auction...
          </div>
        </main>
      </PageLayout>
    );
  }

  if (!auction) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-2xl bg-white p-8 shadow-md">
            Auction not found.
          </div>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <Link to="/seller/auctions" className="font-semibold text-blue-600">
          ← Back to Seller Auctions
        </Link>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-md">
          <h1 className="text-3xl font-black text-slate-900">
            Move Auction to Marketplace
          </h1>

          <p className="mt-2 text-slate-500">
            Confirm the fixed-price listing details before moving this auction
            into your marketplace shop.
          </p>

          {error && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <section>
              {auction.imageUrl ? (
                <img
                  src={auction.imageUrl}
                  alt={auction.title}
                  className="h-72 w-full rounded-xl bg-slate-100 object-contain"
                />
              ) : (
                <div className="flex h-72 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  No Image
                </div>
              )}

              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  Suggested price:{" "}
                  <span className="font-bold text-slate-900">
                    ${suggestedPrice}
                  </span>
                </p>
                <p className="mt-1">
                  You can change this before publishing the marketplace listing.
                </p>
              </div>
            </section>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Listing Title
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="5"
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Marketplace Price
                  </label>
                  <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Stock
                  </label>
                  <input
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    type="number"
                    min="1"
                    step="1"
                    className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  >
                    <option value="TCG">TCG</option>
                    <option value="Figurine">Figurine</option>
                    <option value="Album">Album</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={form.condition}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  >
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Delivery Methods
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  {DEFAULT_DELIVERY_METHODS.map((method) => (
                    <label
                      key={method}
                      className="cursor-pointer rounded-xl border border-slate-300 p-4 hover:border-sky-500"
                    >
                      <input
                        type="checkbox"
                        checked={form.deliveryMethods.includes(method)}
                        onChange={() => handleDeliveryMethodChange(method)}
                        className="mr-2"
                      />
                      {formatDeliveryMethod(method)}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-md bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Moving..." : "Move to Marketplace"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}