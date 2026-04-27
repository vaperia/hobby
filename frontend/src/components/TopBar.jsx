import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function TopBar() {
  const { user, isAuthenticated } = useAuth();

  const isSeller = user?.role === "seller" || user?.role === "admin";

  return (
    <div className="bg-gradient-to-r from-purple-700 via-red-600 to-sky-500 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs">
        <div className="flex items-center gap-4">
          {isAuthenticated && isSeller ? (
            <Link to="/seller" className="hover:text-orange-200">
              Seller Centre
            </Link>
          ) : (
            <Link to="/register" className="hover:text-orange-200">
              Seller Centre
            </Link>
          )}

          {isAuthenticated && isSeller ? (
            <Link to="/seller" className="hover:text-orange-200">
              My Shop
            </Link>
          ) : (
            <Link to="/register" className="hover:text-orange-200">
              Start Selling
            </Link>
          )}

          <Link to="/" className="hover:text-orange-200">
            Download
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-orange-200">
            Notifications
          </Link>

          <Link to="/" className="hover:text-orange-200">
            Help
          </Link>

          {isAuthenticated ? (
            <Link to="/profile" className="font-semibold hover:text-orange-200">
              Hi, {user?.username || user?.name || "User"}
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="font-semibold hover:text-orange-200"
              >
                Sign Up
              </Link>

              <Link
                to="/login"
                className="font-semibold hover:text-orange-200"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}