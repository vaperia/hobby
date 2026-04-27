import Hero from "../components/Hero";
import CategoryIcons from "../components/CategoryIcons";
import FeaturedProducts from "../components/FeaturedProducts";
import PageLayout from "../components/PageLayout";

export default function Home() {
  return (
    <PageLayout>
      <Hero />
      <CategoryIcons />
      <FeaturedProducts />
    </PageLayout>
  );
}