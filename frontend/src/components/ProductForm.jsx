import ImageUpload from "./ImageUpload";

const DEFAULT_DELIVERY_METHODS = ["SELF_COLLECTION", "STANDARD_DELIVERY"];

export default function ProductForm({
  form,
  onChange,
  onImageChange,
  onSubmit,
  loading = false,
  submitText = "Save Product",
  existingImageUrl = "",
}) {
  const deliveryMethods = form.deliveryMethods || DEFAULT_DELIVERY_METHODS;

  function handleInputChange(e) {
    const { name, value } = e.target;
    onChange(name, value);
  }

  function handleDeliveryMethodChange(method) {
    const updatedMethods = deliveryMethods.includes(method)
      ? deliveryMethods.filter((item) => item !== method)
      : [...deliveryMethods, method];

    onChange("deliveryMethods", updatedMethods);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Product Name
        </label>

        <input
          name="name"
          value={form.name || ""}
          onChange={handleInputChange}
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
          value={form.description || ""}
          onChange={handleInputChange}
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
            value={form.price || ""}
            onChange={handleInputChange}
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
            value={form.stock || ""}
            onChange={handleInputChange}
            type="number"
            min="0"
            step="1"
            placeholder="Enter stock quantity"
            className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
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
            value={form.category || "TCG"}
            onChange={handleInputChange}
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
            value={form.condition || "New"}
            onChange={handleInputChange}
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
              checked={deliveryMethods.includes("SELF_COLLECTION")}
              onChange={() => handleDeliveryMethodChange("SELF_COLLECTION")}
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
              checked={deliveryMethods.includes("STANDARD_DELIVERY")}
              onChange={() => handleDeliveryMethodChange("STANDARD_DELIVERY")}
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

        {deliveryMethods.length === 0 && (
          <p className="mt-2 text-sm text-red-600">
            Please select at least one delivery method.
          </p>
        )}
      </div>

      <ImageUpload
        value={form.image || existingImageUrl}
        onChange={onImageChange}
        label="Product Image"
      />

      <button
        type="submit"
        disabled={loading || deliveryMethods.length === 0}
        className="w-full rounded-md bg-gradient-to-r from-purple-700 via-blue-600 to-orange-500 py-3 font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Saving..." : submitText}
      </button>
    </form>
  );
}