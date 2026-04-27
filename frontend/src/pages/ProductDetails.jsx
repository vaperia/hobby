import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ref, getDownloadURL } from "firebase/storage";
import PageLayout from "../components/PageLayout";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";
import { useAuth } from "../context/AuthContext";
import { storage } from "../firebase";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [imageSrc, setImageSrc] = useState("");
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError("");

      try {
        const data = await productService.getById(id);
        setProduct(data);
      } catch (err) {
        console.error("Load product details error:", err);
        setError(err.message || "Failed to fetch product details.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      try {
        setImageError(false);

        const rawImage =
          product?.imageUrl ||
          product?.image_url ||
          product?.imageURL ||
          product?.image ||
          product?.imagePath ||
          product?.image_path ||
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
        console.error("Failed to load product detail image:", err);

        if (isMounted) {
          setImageError(true);
          setImageSrc("");
        }
      }
    }

    if (product) {
      loadImage();
    }

    return () => {
      isMounted = false;
    };
  }, [product]);

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setCartLoading(true);
    setError("");
    setMessage("");

    try {
      await cartService.addItem({
        productId: product.id,
        quantity: 1,
      });

      setMessage("Product added to cart.");
    } catch (err) {
      console.error("Add to cart error:", err);
      setError(err.message || "Failed to add product to cart.");
    } finally {
      setCartLoading(false);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-slate-600">Loading product details...</p>
        </main>
      </PageLayout>
    );
  }

  if (error && !product) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </main>
      </PageLayout>
    );
  }

  if (!product) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-slate-600">Product not found.</p>
        </main>
      </PageLayout>
    );
  }

  const productName = product.name || product.title || "Unnamed Product";
  const price = Number(product.price || 0);
  const stock = Number(product.stock || 0);

  return (
    <PageLayout>
      <main className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2">
        <div>
          {imageSrc && !imageError ? (
            <img
              src={imageSrc}
              alt={productName}
              className="h-[500px] w-full rounded-3xl bg-white object-cover shadow-md"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-[500px] w-full items-center justify-center rounded-3xl bg-slate-100 text-slate-400 shadow-md">
              No image available
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-md">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">
            {product.category || "Product"}
          </p>

          <h1 className="mt-3 text-4xl font-black text-slate-900">
            {productName}
          </h1>

          <p className="mt-4 text-2xl font-bold text-red-500">
            ${price.toFixed(2)}
          </p>

          <p className="mt-6 leading-relaxed text-slate-600">
            {product.description || "No description provided."}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-sky-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Stock</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{stock}</p>
            </div>

            <div className="rounded-xl bg-sky-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Condition</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {product.condition || "-"}
              </p>
            </div>
          </div>

          {product.seller && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Seller</p>
              <p className="mt-1 font-bold text-slate-900">
                {product.seller.username || product.seller.email || "Unknown"}
              </p>
            </div>
          )}

          {message && (
            <div className="mt-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {error && product && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={cartLoading || stock <= 0}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-3 font-semibold text-white hover:from-blue-700 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {stock <= 0
              ? "Out of Stock"
              : cartLoading
              ? "Adding..."
              : "Add to Cart"}
          </button>
        </div>
      </main>
    </PageLayout>
  );
}