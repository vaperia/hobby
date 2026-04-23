import React from "react";
import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md">
      <img
        src={product.image}
        alt={product.name}
        className="h-52 w-full object-cover"
      />

      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
          {product.category}
        </p>

        <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
          {product.name}
        </h3>

        <p className="mt-3 text-lg font-bold text-red-500">
          ${product.price.toFixed(2)}
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