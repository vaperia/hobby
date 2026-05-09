import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { productService } from "../services/productService";

function getDefaultEndDateTime() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function ConvertListingToAuction() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "TCG",
    condition: "New",
    startingBid: "",
    bidIncrement: "1",
    buyoutPrice: "",
    endsAt: getDefaultEndDateTime(),
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadListing() {
      try {
        setLoading(true);
        setError("");

        const data = await productService.getById(id);

        setListing(data);
        setForm({
          title: data.title || data.name || "",
          description: data.description || "",
          category: data.category || "TCG",
          condition: data.condition || "New",
          startingBid: data.price ? Number(data.price).toFixed(2) : "",
          bidIncrement: "1",
          buyoutPrice: data.price ? Number(data.price).toFixed(2) : "",
          endsAt: getDefaultEndDateTime(),
        });
      } catch (err) {
        console.error("Load listing error:", err);
        setError(err.message || "Failed to load listing.");
      } finally {
        setLoading(false);
      }
    }

    loadListing();
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/products/${id}/convert-to-auction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to move listing to auction.");
      }

      navigate("/seller/auctions");
    } catch (err) {
      console.error("Convert listing error:", err);
      setError(err.message || "Failed to move listing to auction.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-2xl bg-white p-8 shadow-md">
            Loading listing...
          </div>
        </main>
      </PageLayout>
    );
  }

  if (!listing) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-2xl bg-white p-8 shadow-md">
            Listing not found.
          </div>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <Link to="/seller/shop" className="font-semibold text-blue-600">
          ← Back to My Shop
        </Link>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-md">
          <h1 className="text-3xl font-black text-slate-900">
            Move Listing to Auction
          </h1>

          <p className="mt-2 text-slate-500">
            Confirm the auction details before moving this marketplace listing
            into your auction page.
          </p>

          {error && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <section>
              {listing.imageUrl ? (
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="h-72 w-full rounded-xl bg-slate-100 object-contain"
                />
              ) : (
                <div className="flex h-72 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  No Image
                </div>
              )}

              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  Current marketplace price:{" "}
                  <span className="font-bold text-slate-900">
                    ${Number(listing.price || 0).toFixed(2)}
                  </span>
                </p>

                <p className="mt-1">
                  You can set a lower starting bid and an optional buyout price.
                </p>
              </div>
            </section>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Auction Title
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

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Starting Bid
                  </label>
                  <input
                    name="startingBid"
                    value={form.startingBid}
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
                    Bid Increment
                  </label>
                  <input
                    name="bidIncrement"
                    value={form.bidIncrement}
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
                    Buyout Price
                  </label>
                  <input
                    name="buyoutPrice"
                    value={form.buyoutPrice}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                    className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Auction End Date
                </label>
                <input
                  name="endsAt"
                  value={form.endsAt}
                  onChange={handleChange}
                  type="datetime-local"
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-md bg-purple-700 py-3 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Moving..." : "Move to Auction"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}