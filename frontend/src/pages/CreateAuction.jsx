import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import ImageUpload from "../components/ImageUpload";
import { auctionService } from "../services/auctionService";

export default function CreateAuction() {
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
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("condition", form.condition);
      formData.append("startingBid", form.startingBid);
      formData.append("bidIncrement", form.bidIncrement);
      formData.append("buyoutPrice", form.buyoutPrice);
      formData.append("endsAt", form.endsAt);

      if (form.image) {
        formData.append("image", form.image);
      }

      await auctionService.create(formData);

      navigate("/seller/auctions");
    } catch (err) {
      console.error("Create auction error:", err);
      setError(err.message || "Failed to create auction.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-2xl bg-white p-8 shadow-md">
          <h1 className="text-3xl font-black text-slate-900">
            Create Auction
          </h1>

          <p className="mt-2 text-slate-500">
            Create a standalone auction with bidding and optional buyout.
          </p>

          {error && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
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
                required
                className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
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
                rows="5"
                required
                className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
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
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
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
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Starting Bid
                </label>

                <input
                  name="startingBid"
                  value={form.startingBid}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
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
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Buyout Price Optional
                </label>

                <input
                  name="buyoutPrice"
                  value={form.buyoutPrice}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
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
                type="datetime-local"
                required
                className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />
            </div>

            <ImageUpload
              value={form.image}
              onChange={handleImageChange}
              label="Auction Image"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gradient-to-r from-purple-700 via-blue-600 to-orange-500 py-3 font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Auction"}
            </button>
          </form>
        </div>
      </main>
    </PageLayout>
  );
}