import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ImageUpload from "../components/ImageUpload";
import LoadingSpinner from "../components/LoadingSpinner";
import { productService } from "../services/productService";

const initialForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "TCG",
  condition: "New",
  image: null,
};

export default function CreateListing() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
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
    setMessage("");
    setError("");

    try {
      const formData = new FormData();

      formData.append("title", form.name);
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("stock", form.stock);
      formData.append("category", form.category);
      formData.append("condition", form.condition);

      if (form.image) {
        formData.append("image", form.image);
      }

      const result = await productService.create(formData);

      console.log("CREATE LISTING RESULT:", result);

      setMessage("Listing created successfully.");
      setForm(initialForm);
    } catch (err) {
      console.error("Create listing error:", err);
      setError(err.message || "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sky-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-2xl bg-white p-8 shadow-md">
          <h1 className="text-3xl font-black text-slate-900">
            Create New Listing
          </h1>

          <p className="mt-2 text-slate-500">
            Add a new product for buyers to discover
          </p>

          {message && (
            <div className="mt-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <LoadingSpinner text="Creating listing..." />
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Product Name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  type="text"
                  placeholder="Enter product name"
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
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
                  rows="5"
                  placeholder="Describe your product"
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Price
                  </label>

                  <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter price"
                    className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Stock
                  </label>

                  <input
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter stock quantity"
                    className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                    required
                  />
                </div>
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

              <ImageUpload
                value={form.image}
                onChange={handleImageChange}
                label="Product Image"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-gradient-to-r from-purple-700 via-blue-600 to-orange-500 py-3 font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Create Listing
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}