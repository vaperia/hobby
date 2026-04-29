import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import ImageUpload from "../components/ImageUpload";
import { auctionService } from "../services/auctionService";

function toDatetimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

export default function EditAuction() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "TCG",
    condition: "New",
    startingBid: "",
    bidIncrement: "1",
    buyoutPrice: "",
    endsAt: "",
    image: null,
    existingImageUrl: "",
  });

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const hasBids = (auction?.bids?.length || 0) > 0;
  const locked =
    auction?.status === "PAID" || auction?.status === "AWAITING_PAYMENT";

  async function loadAuction() {
    try {
      setLoading(true);
      setError("");

      const data = await auctionService.getById(id);

      setAuction(data);

      setForm({
        title: data.title || "",
        description: data.description || "",
        category: data.category || "TCG",
        condition: data.condition || "New",
        startingBid: data.startingBid ?? "",
        bidIncrement: data.bidIncrement ?? "1",
        buyoutPrice: data.buyoutPrice ?? "",
        endsAt: toDatetimeLocal(data.endsAt),
        image: null,
        existingImageUrl: data.imageUrl || "",
      });
    } catch (err) {
      console.error("Load auction error:", err);
      setError(err.message || "Failed to load auction.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuction();
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleImageChange(file) {
    setForm((prev) => ({
      ...prev,
      image: file,
      existingImageUrl: file ? "" : prev.existingImageUrl,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const formData = new FormData();

      formData.append("buyoutPrice", form.buyoutPrice);
      formData.append("endsAt", form.endsAt);

      if (!hasBids) {
        formData.append("title", form.title);
        formData.append("description", form.description);
        formData.append("category", form.category);
        formData.append("condition", form.condition);
        formData.append("startingBid", form.startingBid);
        formData.append("bidIncrement", form.bidIncrement);

        if (form.image) {
          formData.append("image", form.image);
        }
      }

      await auctionService.update(id, formData);

      setMessage("Auction updated successfully.");

      setTimeout(() => {
        navigate("/seller/auctions");
      }, 700);
    } catch (err) {
      console.error("Update auction error:", err);
      setError(err.message || "Failed to update auction.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-4xl px-6 py-16">
          Loading auction...
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="mx-auto max-w-4xl px-6 py-16">
        <Link to="/seller/auctions" className="font-semibold text-blue-600">
          ← Back to Seller Auctions
        </Link>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-md">
          <h1 className="text-3xl font-black text-slate-900">Edit Auction</h1>

          <p className="mt-2 text-slate-500">
            {hasBids
              ? "This auction already has bids. You can only extend the end time and edit the buyout price."
              : "Edit your auction details before bids are placed."}
          </p>

          {locked && (
            <div className="mt-6 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
              This auction is awaiting payment or already paid, so it cannot be
              edited.
            </div>
          )}

          {hasBids && !locked && (
            <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Bids exist for this auction. To protect bidders, you can only
              extend the auction end time and adjust the buyout price.
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Auction Title
              </label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                disabled={hasBids || locked}
                className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 disabled:bg-slate-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={hasBids || locked}
                rows="5"
                className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 disabled:bg-slate-100"
                required
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  disabled={hasBids || locked}
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 disabled:bg-slate-100"
                >
                  <option value="TCG">TCG</option>
                  <option value="Figurine">Figurine</option>
                  <option value="Album">Album</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Condition
                </label>

                <select
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  disabled={hasBids || locked}
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 disabled:bg-slate-100"
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Used">Used</option>
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Starting Bid
                </label>

                <input
                  name="startingBid"
                  value={form.startingBid}
                  onChange={handleChange}
                  disabled={hasBids || locked}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Bid Increment
                </label>

                <input
                  name="bidIncrement"
                  value={form.bidIncrement}
                  onChange={handleChange}
                  disabled={hasBids || locked}
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Buyout Price
                </label>

                <input
                  name="buyoutPrice"
                  value={form.buyoutPrice}
                  onChange={handleChange}
                  disabled={locked}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Auction End Date
              </label>

              <input
                name="endsAt"
                value={form.endsAt}
                onChange={handleChange}
                disabled={locked}
                type="datetime-local"
                required
                className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 disabled:bg-slate-100"
              />

              {hasBids && (
                <p className="mt-2 text-sm text-slate-500">
                  Since bids already exist, you can only extend the end time.
                </p>
              )}
            </div>

            {!hasBids && (
              <ImageUpload
                value={form.image || form.existingImageUrl}
                onChange={handleImageChange}
                label="Auction Image"
              />
            )}

            <button
              type="submit"
              disabled={saving || locked}
              className="w-full rounded-md bg-gradient-to-r from-purple-700 via-blue-600 to-orange-500 py-3 font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Auction Changes"}
            </button>
          </form>
        </div>
      </main>
    </PageLayout>
  );
}