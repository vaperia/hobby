import { useEffect, useState } from "react";

const MAX_UPLOAD_MB = 15;
const TARGET_MAX_WIDTH = 1400;
const TARGET_MAX_HEIGHT = 1400;
const COMPRESSION_QUALITY = 0.82;

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";

  const mb = bytes / (1024 * 1024);

  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }

  return `${(bytes / 1024).toFixed(0)} KB`;
}

function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      resolve({
        width: image.width,
        height: image.height,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to read image dimensions."));
    };

    image.src = objectUrl;
  });
}

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = image;

      const widthRatio = TARGET_MAX_WIDTH / width;
      const heightRatio = TARGET_MAX_HEIGHT / height;
      const ratio = Math.min(widthRatio, heightRatio, 1);

      const newWidth = Math.round(width * ratio);
      const newHeight = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Unable to compress image."));
        return;
      }

      context.drawImage(image, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image compression failed."));
            return;
          }

          const originalName = file.name.replace(/\.[^/.]+$/, "");
          const compressedFile = new File([blob], `${originalName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        "image/webp",
        COMPRESSION_QUALITY
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image."));
    };

    image.src = objectUrl;
  });
}

export default function ImageUpload({
  value,
  onChange,
  label = "Image",
  required = false,
}) {
  const [preview, setPreview] = useState("");
  const [originalInfo, setOriginalInfo] = useState(null);
  const [compressedInfo, setCompressedInfo] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!value) {
      setPreview("");
      return;
    }

    if (typeof value === "string") {
      setPreview(value);
      return;
    }

    const objectUrl = URL.createObjectURL(value);
    setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [value]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");
    setProcessing(true);
    setOriginalInfo(null);
    setCompressedInfo(null);

    try {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a JPG, JPEG, PNG, or WEBP image.");
        return;
      }

      const originalSizeMb = file.size / (1024 * 1024);

      if (originalSizeMb > MAX_UPLOAD_MB) {
        setError(`Image is too large. Please upload below ${MAX_UPLOAD_MB}MB.`);
        return;
      }

      const dimensions = await getImageDimensions(file);

      setOriginalInfo({
        size: file.size,
        width: dimensions.width,
        height: dimensions.height,
      });

      const compressedFile = await resizeImageFile(file);
      const compressedDimensions = await getImageDimensions(compressedFile);

      setCompressedInfo({
        size: compressedFile.size,
        width: compressedDimensions.width,
        height: compressedDimensions.height,
      });

      onChange(compressedFile);
    } catch (err) {
      console.error("Image processing error:", err);
      setError(err.message || "Failed to process image.");
    } finally {
      setProcessing(false);
      e.target.value = "";
    }
  }

  function handleRemoveImage() {
    setPreview("");
    setOriginalInfo(null);
    setCompressedInfo(null);
    setError("");
    onChange(null);
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="rounded-md border border-dashed border-slate-300 bg-white p-4">
        {preview ? (
          <div className="relative">
            <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100">
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-contain"
              />
            </div>

            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute right-3 top-3 rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex h-56 w-full flex-col items-center justify-center rounded-lg bg-slate-50 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Upload product image
            </p>

            <p className="mt-1 text-xs text-slate-400">
              JPG, PNG, JPEG, or WEBP. Images are compressed automatically.
            </p>
          </div>
        )}

        {processing && (
          <div className="mt-4 rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Processing image...
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {(originalInfo || compressedInfo) && (
          <div className="mt-4 grid gap-3 text-xs text-slate-600 md:grid-cols-2">
            {originalInfo && (
              <div className="rounded-md bg-slate-50 p-3">
                <p className="font-semibold text-slate-700">Original</p>
                <p>Size: {formatFileSize(originalInfo.size)}</p>
                <p>
                  Dimension: {originalInfo.width} × {originalInfo.height}
                </p>
              </div>
            )}

            {compressedInfo && (
              <div className="rounded-md bg-green-50 p-3 text-green-700">
                <p className="font-semibold">Optimised</p>
                <p>Size: {formatFileSize(compressedInfo.size)}</p>
                <p>
                  Dimension: {compressedInfo.width} × {compressedInfo.height}
                </p>
              </div>
            )}
          </div>
        )}

        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          required={required && !preview}
          onChange={handleFileChange}
          disabled={processing}
          className="mt-4 w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:font-semibold file:text-slate-700 hover:file:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    </div>
  );
}