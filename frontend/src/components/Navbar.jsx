import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [search, setSearch] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const trimmed = search.trim();
    if (!trimmed) {
      navigate("/products");
      return;
    }

    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="bg-gradient-to-r from-purple-800 via-blue-700 to-sky-500 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
        <Link to="/" className="text-4xl font-black tracking-tight">
          HobbyHub
        </Link>

        <div className="flex-1">
          <form
            onSubmit={handleSubmit}
            className="flex overflow-hidden rounded-md bg-white shadow"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for TCG, Figurine, Album..."
              className="w-full px-4 py-3 text-sm text-slate-800 outline-none"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-red-500 to-orange-500 px-6 text-sm font-semibold text-white hover:from-red-600 hover:to-orange-600"
            >
              Search
            </button>
          </form>

          <nav className="mt-3 flex flex-wrap items-center gap-6 text-sm font-medium text-white">
            <Link to="/" className="hover:text-orange-200">
              Home
            </Link>
            <Link to="/products?category=TCG" className="hover:text-orange-200">
              TCG
            </Link>
            <Link to="/products?category=Figurine" className="hover:text-orange-200">
              Figurine
            </Link>
            <Link to="/products?category=Album" className="hover:text-orange-200">
              Album
            </Link>
            <Link to="/cart" className="hover:text-orange-200">
              Cart
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/profile" className="hover:text-orange-200">
                  {user?.username || "Profile"}
                </Link>

                <Link to="/orders" className="hover:text-orange-200">
                  Orders
                </Link>

                {(user?.role === "seller" || user?.role === "admin") && (
                  <Link to="/seller" className="hover:text-orange-200">
                    Seller Dashboard
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="hover:text-orange-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-orange-200">
                  Login
                </Link>
                <Link to="/register" className="hover:text-orange-200">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}