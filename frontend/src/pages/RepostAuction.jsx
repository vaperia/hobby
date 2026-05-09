import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const API_BASE = "http://localhost:5000/api";

function getDefaultEndDateTime() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function RepostAuction() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [auction, setAuction] = useState(null);
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
    async function loadAuction() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/auctions/${id}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load auction.");
        }

        setAuction(data);
        setForm({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "TCG",
          condition: data.condition || "New",
          startingBid: data.startingBid
            ? Number(data.startingBid).toFixed(2)
            : "",
          bidIncrement: data.bidIncrement
            ? Number(data.bidIncrement).toFixed(2)
            : "1.00",
          buyoutPrice: data.buyoutPrice
            ? Number(data.buyoutPrice).toFixed(2)
            : "",
          endsAt: getDefaultEndDateTime(),
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

  async function handleSubmit(e) {
    e.preventDefault();

    const confirmRepost = window.confirm(
      "Repost this auction? Previous bids and winner/payment data will be cleared."
    );

    if (!confirmRepost) return;

    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/auctions/${id}/repost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to repost auction.");
      }

      navigate("/seller/auctions");
    } catch (err) {
      console.error("Repost auction error:", err);
      setError(err.message || "Failed to repost auction.");
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
            Repost Auction
          </h1>

          <p className="mt-2 text-slate-500">
            Double-check the auction details and choose a new ending time before
            reposting.
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
                  Current status:{" "}
                  <span className="font-bold text-slate-900">
                    {auction.status}
                  </span>
                </p>

                <p className="mt-1">
                  Existing bid history will be cleared when you repost.
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
                  New Auction End Date
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
                {saving ? "Reposting..." : "Repost Auction"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}