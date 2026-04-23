import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <h3 className="text-2xl font-black text-slate-900">HobbyHub</h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
          A marketplace for collectors to browse TCG products, figurines, and albums in one place.
        </p>

        <div className="mt-8 text-sm text-slate-500">
          © 2026 HobbyHub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}