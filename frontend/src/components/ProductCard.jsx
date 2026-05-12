import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export default function ProductCard({ product }) {
  const [imageSrc, setImageSrc] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      try {
        setImageError(false);

        const rawImage =
          product.imageUrl ||
          product.image_url ||
          product.imageURL ||
          product.image ||
          product.imagePath ||
          product.image_path ||
          "";

        if (!rawImage) {
          if (isMounted) setImageSrc("");
          return;
        }

        if (rawImage.startsWith("http")) {
          if (isMounted) setImageSrc(rawImage);
          return;
        }

        const imageRef = ref(storage, rawImage);
        const downloadUrl = await getDownloadURL(imageRef);

        if (isMounted) {
          setImageSrc(downloadUrl);
        }
      } catch (err) {
        console.error("Failed to load product image:", err);

        if (isMounted) {
          setImageError(true);
          setImageSrc("");
        }
      }
    }

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [product]);

  const productName = product.name || product.title || "Unnamed Product";
  const price = Number(product.price || 0);
  const sellerType = product.sellerType === "SHOP" ? "Shop Seller" : "Private Seller";

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md">
      {imageSrc && !imageError ? (
        <img
          src={imageSrc}
          alt={productName}
          className="h-52 w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-52 w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
          No image available
        </div>
      )}

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
            {product.category || "Item"}
          </p>

          <span
            className={`rounded-full px-2 py-1 text-[11px] font-bold ${
              product.sellerType === "SHOP"
                ? "bg-blue-50 text-blue-700"
                : "bg-orange-50 text-orange-700"
            }`}
          >
            {sellerType}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
          {productName}
        </h3>

        {product.seller?.username && (
          <p className="mt-1 text-xs text-slate-500">
            Sold by {product.seller.username}
          </p>
        )}

        <p className="mt-3 text-lg font-bold text-red-500">
          ${price.toFixed(2)}
        </p>

        <Link
          to={`/products/${product.id}`}
          className="mt-4 inline-block rounded-md bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-orange-500"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
