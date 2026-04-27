import TopBar from "./TopBar";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PageLayout({ children, className = "bg-sky-50" }) {
  return (
    <div className={`min-h-screen ${className}`}>
      <TopBar />
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}