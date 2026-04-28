import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import ImageUpload from "../components/ImageUpload";
import LoadingSpinner from "../components/LoadingSpinner";
import { productService } from "../services/productService";

const DEFAULT_DELIVERY_METHODS = ["SELF_COLLECTION", "STANDARD_DELIVERY"];

const initialForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "TCG",
  condition: "New",
  image: null,
  existingImageUrl: "",
  deliveryMethods: DEFAULT_DELIVERY_METHODS,
};

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadListing() {
      setPageLoading(true);
      setError("");

      try {
        const product = await productService.getById(id);

        setForm({
          name: product.title || product.name || "",
          description: product.description || "",
          price: product.price ?? "",
          stock: product.stock ?? "",
          category: product.category || "TCG",
          condition: product.condition || "New",
          image: null,
          existingImageUrl:
            product.imageUrl ||
            product.image_url ||
            product.imageURL ||
            product.image ||
            "",
          deliveryMethods:
            product.deliveryMethods ||
            product.delivery_methods ||
            DEFAULT_DELIVERY_METHODS,
        });
      } catch (err) {
        console.error("Load listing error:", err);
        setError(err.message || "Failed to load listing.");
      } finally {
        setPageLoading(false);
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

  function handleImageChange(file) {
    setForm((prev) => ({
      ...prev,
      image: file,
      existingImageUrl: file ? "" : prev.existingImageUrl,
    }));
  }

  function handleDeliveryMethodChange(method) {
    setForm((prev) => {
      const currentMethods = prev.deliveryMethods || [];

      const updatedMethods = currentMethods.includes(method)
        ? currentMethods.filter((item) => item !== method)
        : [...currentMethods, method];

      return {
        ...prev,
        deliveryMethods: updatedMethods,
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    if (!form.deliveryMethods.length) {
      setError("Please select at least one delivery method.");
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();

      formData.append("title", form.name);
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("stock", form.stock);
      formData.append("category", form.category);
      formData.append("condition", form.condition);
      formData.append("deliveryMethods", JSON.stringify(form.deliveryMethods));

      if (form.image) {
        formData.append("image", form.image);
      }

      await productService.update(id, formData);

      setMessage("Listing updated successfully.");

      setTimeout(() => {
        navigate("/seller");
      }, 600);
    } catch (err) {
      console.error("Update listing error:", err);
      setError(err.message || "Failed to update listing.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageLayout>
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-2xl bg-white p-8 shadow-md">
          <h1 className="text-3xl font-black text-slate-900">Edit Listing</h1>

          <p className="mt-2 text-slate-500">Update your product details</p>

          {pageLoading ? (
            <LoadingSpinner text="Loading listing..." />
          ) : (
            <>
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Available Delivery Methods
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="cursor-pointer rounded-xl border border-slate-300 p-4 hover:border-sky-500">
                      <input
                        type="checkbox"
                        checked={form.deliveryMethods.includes(
                          "SELF_COLLECTION"
                        )}
                        onChange={() =>
                          handleDeliveryMethodChange("SELF_COLLECTION")
                        }
                        className="mr-2"
                      />

                      <span className="font-semibold text-slate-900">
                        Self Collection
                      </span>

                      <p className="mt-1 text-sm text-slate-500">
                        Buyer collects directly from you.
                      </p>
                    </label>

                    <label className="cursor-pointer rounded-xl border border-slate-300 p-4 hover:border-sky-500">
                      <input
                        type="checkbox"
                        checked={form.deliveryMethods.includes(
                          "STANDARD_DELIVERY"
                        )}
                        onChange={() =>
                          handleDeliveryMethodChange("STANDARD_DELIVERY")
                        }
                        className="mr-2"
                      />

                      <span className="font-semibold text-slate-900">
                        Standard Delivery
                      </span>

                      <p className="mt-1 text-sm text-slate-500">
                        You can ship this item to the buyer.
                      </p>
                    </label>
                  </div>
                </div>

                <ImageUpload
                  value={form.image || form.existingImageUrl}
                  onChange={handleImageChange}
                  label="Product Image"
                />

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-md bg-gradient-to-r from-purple-700 via-blue-600 to-orange-500 py-3 font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </PageLayout>
  );
}