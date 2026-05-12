import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { sellerService } from "../services/sellerService";

function formatDeliveryMethod(method) {
  if (method === "SELF_COLLECTION") return "Self Collection";
  if (method === "STANDARD_DELIVERY") return "Standard Delivery";
  return method;
}

function formatStatus(status) {
  if (!status) return "Pending";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function SellerShop() {
  const [shop, setShop] = useState({
    seller: null,
    stats: {},
    listings: [],
    auctions: [],
    categories: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadShop() {
    try {
      setLoading(true);
      setError("");

      const data = await sellerService.getShop();

      setShop({
        seller: data.seller || null,
        stats: data.stats || {},
        listings: data.listings || [],
        auctions: data.auctions || [],
        categories: data.categories || [],
      });
    } catch (err) {
      console.error("Load seller shop error:", err);
      setError(err.message || "Failed to load seller shop.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShop();
  }, []);

  const sellerName =
    shop.seller?.username || shop.seller?.email || "My Hobby Shop";

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-6 py-16">
        {loading ? (
          <div className="rounded-2xl bg-white p-8 shadow-md">
            Loading shop...
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <>
            <section className="rounded-3xl bg-gradient-to-r from-purple-800 via-blue-700 to-sky-500 p-10 text-white shadow-md">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                    My Shop Preview
                  </p>

                  <h1 className="mt-2 text-4xl font-black">{sellerName}</h1>

                  <p className="mt-3 max-w-2xl text-white/90">
                    This is how your shop overview can look to buyers. Use this
                    page to review your marketplace listings, auction listings,
                    and shop presentation.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/seller/products/new"
                    className="rounded-md bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-slate-100"
                  >
                    Add Marketplace Listing
                  </Link>

                  <Link
                    to="/seller/auctions/new"
                    className="rounded-md bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
                  >
                    Add Auction Listing
                  </Link>
                </div>
              </div>
            </section>

            <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 shadow-md">
                <p className="text-sm font-semibold text-slate-500">
                  Marketplace Listings
                </p>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {shop.stats?.totalListings || 0}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-md">
                <p className="text-sm font-semibold text-slate-500">
                  Auction Listings
                </p>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {shop.stats?.totalAuctions || 0}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-md">
                <p className="text-sm font-semibold text-slate-500">
                  Categories
                </p>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {shop.stats?.categories || 0}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-md">
                <p className="text-sm font-semibold text-slate-500">
                  Total Shop Items
                </p>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {(shop.stats?.totalListings || 0) +
                    (shop.stats?.totalAuctions || 0)}
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-2xl bg-white p-6 shadow-md">
              <p className="text-sm font-semibold text-slate-500">
                Delivery Methods
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {(shop.stats?.deliveryMethods || []).length === 0 ? (
                  <span className="text-sm text-slate-500">
                    No delivery methods found.
                  </span>
                ) : (
                  shop.stats.deliveryMethods.map((method) => (
                    <span
                      key={method}
                      className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700"
                    >
                      {formatDeliveryMethod(method)}
                    </span>
                  ))
                )}
              </div>
            </section>

            <section className="mt-10">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Shop Listings
                  </h2>

                  <p className="mt-2 text-slate-500">
                    Marketplace and auction listings currently shown under your
                    shop.
                  </p>
                </div>

                <Link
                  to="/seller"
                  className="rounded-md bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
                >
                  Back to Seller Centre
                </Link>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Marketplace Listings
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Fixed-price products available from your shop.
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                    {shop.listings.length} items
                  </span>
                </div>

                {shop.listings.length === 0 ? (
                  <div className="mt-6 rounded-2xl bg-white p-8 text-slate-600 shadow-md">
                    You have not created any marketplace listings yet.
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {shop.listings.map((listing) => (
                      <div
                        key={listing.id}
                        className="overflow-hidden rounded-2xl bg-white shadow-md"
                      >
                        {listing.imageUrl ? (
                          <img
                            src={listing.imageUrl}
                            alt={listing.title}
                            className="h-48 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-slate-400">
                            No Image
                          </div>
                        )}

                        <div className="p-5">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            {listing.category || "Uncategorized"}
                          </p>

                          <h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-900">
                            {listing.title}
                          </h3>

                          <p className="mt-2 text-sm text-slate-500">
                            Stock: {listing.stock ?? 0}
                          </p>

                          <p className="mt-3 text-xl font-black text-slate-900">
                            ${Number(listing.price || 0).toFixed(2)}
                          </p>

                          <div className="mt-4 grid gap-2">
                            <div className="flex gap-2">
                              <Link
                                to={`/products/${listing.id}`}
                                className="flex-1 rounded-md bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-200"
                              >
                                View
                              </Link>

                              <Link
                                to={`/seller/products/${listing.id}/edit`}
                                className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                              >
                                Edit
                              </Link>
                            </div>

                            <Link
                              to={`/seller/products/${listing.id}/convert-to-auction`}
                              className="rounded-md bg-purple-700 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-purple-800"
                            >
                              Move to Auction
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-10 border-t border-slate-200 pt-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Auction Listings
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Auction items available from your shop.
                    </p>
                  </div>

                  <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">
                    {shop.auctions.length} items
                  </span>
                </div>

                {shop.auctions.length === 0 ? (
                  <div className="mt-6 rounded-2xl bg-white p-8 text-slate-600 shadow-md">
                    You have not created any auction listings yet.
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {shop.auctions.map((auction) => (
                      <div
                        key={auction.id}
                        className="overflow-hidden rounded-2xl bg-white shadow-md"
                      >
                        {auction.imageUrl ? (
                          <img
                            src={auction.imageUrl}
                            alt={auction.title}
                            className="h-48 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-slate-400">
                            No Image
                          </div>
                        )}

                        <div className="p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase text-slate-400">
                              {auction.category || "Uncategorized"}
                            </p>

                            <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700">
                              {formatStatus(auction.status || "pending")}
                            </span>
                          </div>

                          <h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-900">
                            {auction.title}
                          </h3>

                          <p className="mt-2 text-sm text-slate-500">
                            Starting Bid: $
                            {Number(auction.startingBid || 0).toFixed(2)}
                          </p>

                          <p className="mt-3 text-xl font-black text-slate-900">
                            Current Bid: $
                            {Number(
                              auction.currentBid || auction.startingBid || 0
                            ).toFixed(2)}
                          </p>

                          <div className="mt-4 grid gap-2">
                            <div className="flex gap-2">
                              <Link
                                to={`/auctions/${auction.id}`}
                                className="flex-1 rounded-md bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-200"
                              >
                                View
                              </Link>

                              <Link
                                to={`/seller/auctions/${auction.id}/edit`}
                                className="flex-1 rounded-md bg-purple-700 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-purple-800"
                              >
                                Edit
                              </Link>
                            </div>

                            <Link
                              to="/seller/auctions"
                              className="rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
                            >
                              Manage Auction
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </PageLayout>
  );
}
