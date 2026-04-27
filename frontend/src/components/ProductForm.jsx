import ImageUpload from "./ImageUpload";

export default function ProductForm({
  form,
  onChange,
  onImageChange,
  onSubmit,
  loading = false,
  submitText = "Save Product",
  existingImageUrl = "",
}) {
  function handleInputChange(e) {
    const { name, value } = e.target;
    onChange(name, value);
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

      <ImageUpload
        value={form.image || existingImageUrl}
        onChange={onImageChange}
        label="Product Image"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-gradient-to-r from-purple-700 via-blue-600 to-orange-500 py-3 font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Saving..." : submitText}
      </button>
    </form>
  );
}