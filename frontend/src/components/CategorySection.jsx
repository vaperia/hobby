import React from "react";

const categories = [
  {
    name: "Cards",
    description: "Booster packs, singles, and trading card accessories.",
    image:
      "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Figurines",
    description: "Anime figures, scale models, and collectible statues.",
    image:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Albums",
    description: "Music albums, collector editions, and fan bundles.",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Accessories",
    description: "Binders, sleeves, stands, and display cases.",
    image:
      "https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=800&q=80",
  },
];

export default function CategorySection() {
  return (
    <section id="categories" className="mx-auto max-w-7xl px-6 py-20 text-white">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Categories
          </p>
          <h2 className="mt-3 text-3xl font-black md:text-4xl">Shop by Category</h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Browse curated hobby essentials for collectors, music fans, and figure lovers.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => (
          <div
            key={category.name}
            className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40"
          >
            <div className="overflow-hidden">
              <img
                src={category.image}
                alt={category.name}
                className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-white">{category.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{category.description}</p>
              <button className="mt-5 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200">
                Browse Category →
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}