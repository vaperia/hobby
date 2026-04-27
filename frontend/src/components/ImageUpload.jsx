import { useEffect, useRef, useState } from "react";

export default function ImageUpload({
  value,
  onChange,
  label = "Product Image",
  required = false,
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!value) {
      setPreview("");
      return;
    }

    if (typeof value === "string") {
      setPreview(value);
      return;
    }

    const previewUrl = URL.createObjectURL(value);
    setPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [value]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];

    if (!file) {
      onChange?.(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      e.target.value = "";
      onChange?.(null);
      return;
    }

    onChange?.(file);
  }

  function handleRemove() {
    onChange?.(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="rounded-md border border-dashed border-slate-300 bg-white p-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Selected product preview"
              className="h-52 w-full rounded-md object-cover"
            />

            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 rounded-md bg-red-500 px-3 py-1 text-sm font-semibold text-white hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex h-52 w-full items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500">
            No image selected
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileChange}
          required={required}
          className="mt-4 w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
        />
      </div>
    </div>
  );
}