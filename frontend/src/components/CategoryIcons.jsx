import React from "react";

const categories = [
  { name: "TCG", icon: "🃏" },
  { name: "Figurine", icon: "🧸" },
  { name: "Album", icon: "💿" },
];

export default function CategoryIcons() {
  return (
    <section className="bg-sky-50">
      <div className="mx-auto grid max-w-7xl grid-cols-3 gap-6 px-6 py-8">
        {categories.map((category, index) => {
          const circleColors = [
            "bg-purple-100 text-purple-700",
            "bg-red-100 text-red-600",
            "bg-sky-100 text-sky-600",
          ];

          return (
            <div
              key={category.name}
              className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl ${circleColors[index]}`}
              >
                {category.icon}
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">{category.name}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}