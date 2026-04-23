import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";
import { useAuth } from "../context/AuthContext";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
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
        setError(err.message || "Failed to fetch product details.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

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
      setError(err.message || "Failed to add product to cart.");
    } finally {
      setCartLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-16">
          <p>Loading product details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-16">
          <p>Product not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2">
        <img
          src={product.image}
          alt={product.name}
          className="h-[500px] w-full rounded-3xl object-cover"
        />

        <div>
          <p className="text-cyan-300">{product.category}</p>
          <h1 className="mt-3 text-4xl font-black">{product.name}</h1>
          <p className="mt-4 text-xl font-semibold">
            ${Number(product.price).toFixed(2)}
          </p>
          <p className="mt-6 text-slate-300">{product.description}</p>
          <p className="mt-4 text-slate-400">Stock: {product.stock}</p>

          {message && (
            <div className="mt-6 rounded-md border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              {message}
            </div>
          )}

          {error && product && (
            <div className="mt-6 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={cartLoading || product.stock <= 0}
            className="mt-8 rounded-2xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {product.stock <= 0
              ? "Out of Stock"
              : cartLoading
              ? "Adding..."
              : "Add to Cart"}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}