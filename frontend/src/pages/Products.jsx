import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import { productService } from "../services/productService";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "";

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const data = await productService.getAll({
          category,
          search,
          sort,
        });
        setProducts(data);
      } catch (err) {
        setError(err.message || "Failed to fetch products.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [category, search, sort]);

  function handleSortChange(e) {
    const value = e.target.value;
    const nextParams = new URLSearchParams(searchParams);

    if (value) {
      nextParams.set("sort", value);
    } else {
      nextParams.delete("sort");
    }

    setSearchParams(nextParams);
  }

  return (
    <div className="min-h-screen bg-sky-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900">All Products</h1>

            <p className="mt-2 text-slate-500">
              {category
                ? `Showing products in ${category}`
                : search
                ? `Search results for "${search}"`
                : "Browse all available collectibles and hobby items"}
            </p>
          </div>

          <div className="w-full md:w-64">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Sort By
            </label>
            <select
              value={sort}
              onChange={handleSortChange}
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 outline-none focus:border-sky-500"
            >
              <option value="">Default</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-600">Loading products...</div>
        ) : error ? (
          <div className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-slate-600">
            No products found.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}