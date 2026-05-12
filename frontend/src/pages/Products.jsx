import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import AuctionCountdown from "../components/AuctionCountdown";
import { productService } from "../services/productService";
import { auctionService } from "../services/auctionService";

function getProductImage(product) {
  return (
    product.imageUrl ||
    product.image_url ||
    product.imageURL ||
    product.image ||
    ""
  );
}

function getAuctionImage(auction) {
  return auction.imageUrl || auction.image_url || auction.image || "";
}

function SellerTypeBadge({ sellerType }) {
  const isShopSeller = sellerType === "SHOP";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        isShopSeller
          ? "bg-blue-100 text-blue-700"
          : "bg-orange-100 text-orange-700"
      }`}
    >
      {isShopSeller ? "Shop Seller" : "Private Seller"}
    </span>
  );
}

function ProductListingCard({ item }) {
  const image = getProductImage(item);

  return (
    <Link
      to={`/products/${item.id}`}
      className="overflow-hidden rounded-2xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-lg"
    >
      {image ? (
        <img
          src={image}
          alt={item.title || item.name}
          className="h-48 w-full bg-slate-100 object-contain"
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-slate-400">
          No Image
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase text-slate-400">
            {item.category || "Product"}
          </p>

          <div className="flex flex-wrap justify-end gap-2">
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              Fixed Price
            </span>

            <SellerTypeBadge sellerType={item.sellerType} />
          </div>
        </div>

        <h2 className="mt-3 line-clamp-2 text-lg font-bold text-slate-900">
          {item.title || item.name || "Product"}
        </h2>

        <p className="mt-3 text-2xl font-black text-slate-900">
          ${Number(item.price || 0).toFixed(2)}
        </p>

        <p className="mt-2 text-sm text-slate-500">Stock: {item.stock ?? 0}</p>

        {item.seller?.username && (
          <p className="mt-1 text-sm text-slate-500">
            Sold by {item.seller.username}
          </p>
        )}

        <div className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-700">
          View Product
        </div>
      </div>
    </Link>
  );
}

function AuctionListingCard({ item }) {
  const image = getAuctionImage(item);
  const currentBid = item.currentBid || item.startingBid;

  return (
    <Link
      to={`/auctions/${item.id}`}
      className="overflow-hidden rounded-2xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-lg"
    >
      {image ? (
        <img
          src={image}
          alt={item.title}
          className="h-48 w-full bg-slate-100 object-contain"
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-slate-400">
          No Image
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase text-slate-400">
            {item.category || "Auction"}
          </p>

          <div className="flex flex-wrap justify-end gap-2">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
              Auction
            </span>

            <SellerTypeBadge sellerType={item.sellerType} />
          </div>
        </div>

        <h2 className="mt-3 line-clamp-2 text-lg font-bold text-slate-900">
          {item.title || "Auction Item"}
        </h2>

        {item.seller?.username && (
          <p className="mt-2 text-sm text-slate-500">
            Sold by {item.seller.username}
          </p>
        )}

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p>
            Current Bid:{" "}
            <span className="font-bold text-slate-900">
              ${Number(currentBid || 0).toFixed(2)}
            </span>
          </p>

          {item.buyoutPrice && (
            <p>
              Buyout:{" "}
              <span className="font-bold text-orange-600">
                ${Number(item.buyoutPrice).toFixed(2)}
              </span>
            </p>
          )}

          <p>{item.bids?.length || 0} bids</p>

          <AuctionCountdown
            endsAt={item.endsAt}
            status={item.status}
            compact
          />
        </div>

        <div className="mt-4 rounded-md bg-orange-500 px-3 py-2 text-center text-sm font-semibold text-white">
          View Auction
        </div>
      </div>
    </Link>
  );
}

export default function Products() {
  const [searchParams] = useSearchParams();

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [viewType, setViewType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadListings() {
    try {
      setLoading(true);
      setError("");

      const [productData, auctionData] = await Promise.all([
        productService.getAll({
          category,
          search,
        }),
        auctionService.getAll({
          category,
          search,
        }),
      ]);

      setProducts(Array.isArray(productData) ? productData : []);
      setAuctions(Array.isArray(auctionData) ? auctionData : []);
    } catch (err) {
      console.error("Load all listings error:", err);
      setError(err.message || "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, [category, search]);

  const combinedListings = useMemo(() => {
    const fixedProducts = products.map((item) => ({
      ...item,
      listingType: "product",
      sortDate: item.createdAt || item.updatedAt || "",
    }));

    const auctionProducts = auctions.map((item) => ({
      ...item,
      listingType: "auction",
      sortDate: item.createdAt || item.updatedAt || "",
    }));

    let combined = [...fixedProducts, ...auctionProducts];

    if (viewType === "products") {
      combined = fixedProducts;
    }

    if (viewType === "auctions") {
      combined = auctionProducts;
    }

    return combined.sort((a, b) => {
      const dateA = new Date(a.sortDate || 0).getTime();
      const dateB = new Date(b.sortDate || 0).getTime();

      return dateB - dateA;
    });
  }, [products, auctions, viewType]);

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900">
              {category ? `${category} Listings` : "All Listings"}
            </h1>

            <p className="mt-2 text-slate-500">
              {category
                ? `Browse ${category} fixed-price products and auction listings.`
                : "Browse fixed-price products and auction listings in one place."}
            </p>

            {search && (
              <p className="mt-2 text-sm text-slate-500">
                Showing results matching "{search}"
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setViewType("all")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                viewType === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 shadow-sm"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => setViewType("products")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                viewType === "products"
                  ? "bg-green-600 text-white"
                  : "bg-white text-slate-700 shadow-sm"
              }`}
            >
              Fixed Price
            </button>

            <button
              type="button"
              onClick={() => setViewType("auctions")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                viewType === "auctions"
                  ? "bg-orange-500 text-white"
                  : "bg-white text-slate-700 shadow-sm"
              }`}
            >
              Auctions
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-slate-600 shadow-md">
            Loading listings...
          </div>
        ) : combinedListings.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-slate-600 shadow-md">
            No listings found.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {combinedListings.map((item) =>
              item.listingType === "auction" ? (
                <AuctionListingCard key={`auction-${item.id}`} item={item} />
              ) : (
                <ProductListingCard key={`product-${item.id}`} item={item} />
              )
            )}
          </div>
        )}
      </main>
    </PageLayout>
  );
}