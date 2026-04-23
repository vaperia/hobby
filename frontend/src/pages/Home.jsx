import React from "react";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import CategoryIcons from "../components/CategoryIcons";
import FeaturedProducts from "../components/FeaturedProducts";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-sky-50">
      <TopBar />
      <Navbar />
      <Hero />
      <CategoryIcons />
      <FeaturedProducts />
      <Footer />
    </div>
  );
}