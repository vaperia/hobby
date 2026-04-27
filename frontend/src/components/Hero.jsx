import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Hero() {
  const { user, isAuthenticated } = useAuth();

  const isSeller = user?.role === "seller" || user?.role === "admin";

  return (
    <section className="bg-sky-50">
      <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-3">
        <div className="rounded-md bg-gradient-to-r from-purple-100 via-sky-100 to-blue-100 md:col-span-2">
          <div className="p-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-500">
              Collector Marketplace
            </p>

            <h1 className="mt-4 max-w-xl text-4xl font-black leading-tight text-slate-900">
              Find your next rare collectible.
            </h1>

            <p className="mt-4 max-w-lg text-slate-700">
              Shop TCG cards, figurines, and albums all in one place with a
              clean marketplace-style experience.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                to="/products"
                className="rounded-md bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-sky-600"
              >
                Shop Now
              </Link>

              {isAuthenticated ? (
                isSeller ? (
                  <Link
                    to="/seller"
                    className="rounded-md border border-orange-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-orange-50"
                  >
                    Seller Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/profile"
                    className="rounded-md border border-orange-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-orange-50"
                  >
                    My Profile
                  </Link>
                )
              ) : (
                <Link
                  to="/register"
                  className="rounded-md border border-orange-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-orange-50"
                >
                  Join Now
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-md bg-gradient-to-br from-red-500 via-purple-600 to-orange-500 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold">Daily Deals</p>
            <h3 className="mt-2 text-2xl font-black">TCG Bundles</h3>
            <p className="mt-2 text-sm text-white/90">
              Get special offers on selected card packs and collector boxes.
            </p>
          </div>

          <div className="rounded-md bg-gradient-to-br from-sky-500 via-blue-700 to-purple-700 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold">New Arrivals</p>
            <h3 className="mt-2 text-2xl font-black">Figurines & Albums</h3>
            <p className="mt-2 text-sm text-white/90">
              Fresh stock added weekly for fans and collectors.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}