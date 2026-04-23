import React from "react";
import { Link } from "react-router-dom";

export default function TopBar() {
  return (
    <div className="bg-gradient-to-r from-purple-700 via-red-600 to-sky-500 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="hover:text-orange-200">Seller Centre</span>
          <span className="hover:text-orange-200">Start Selling</span>
          <span className="hover:text-orange-200">Download</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hover:text-orange-200">Notifications</span>
          <span className="hover:text-orange-200">Help</span>
          <Link to="/register" className="font-semibold hover:text-orange-200">
            Sign Up
          </Link>
          <Link to="/login" className="font-semibold hover:text-orange-200">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}