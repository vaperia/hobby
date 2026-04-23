import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { productService } from "../services/productService";

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFeaturedProducts() {
      setLoading(true);
      setError("");

      try {
        const data = await productService.getAll({ featured: true });
        setProducts(data);
      } catch (err) {
        setError(err.message || "Failed to fetch featured products.");
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedProducts();
  }, []);

  return (
    <section className="bg-sky-50 py-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">Featured Products</h2>
          <Link
            to="/products"
            className="text-sm font-semibold text-blue-600 hover:text-orange-500"
          >
            See All
          </Link>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading featured products...</p>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No featured products available yet.</p>
        )}
      </div>
    </section>
  );
}