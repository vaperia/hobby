import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import AuctionCountdown from "../components/AuctionCountdown";
import { auctionService } from "../services/auctionService";

export default function Auctions() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") || "";

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAuctions() {
    try {
      setLoading(true);
      setError("");

      const data = await auctionService.getAll({
        category,
      });

      setAuctions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load auctions error:", err);
      setError(err.message || "Failed to load auctions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuctions();
  }, [category]);

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div>
          <h1 className="text-4xl font-black text-slate-900">Auctions</h1>

          <p className="mt-2 text-slate-500">
            Bid on rare hobby items or use buyout when available.
          </p>
        </div>

        {error && (
          <div className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl bg-white p-8 shadow-md">
            Loading auctions...
          </div>
        ) : auctions.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-slate-600 shadow-md">
            No auctions found.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {auctions.map((auction) => {
              const currentBid = auction.currentBid || auction.startingBid;

              return (
                <Link
                  key={auction.id}
                  to={`/auctions/${auction.id}`}
                  className="overflow-hidden rounded-2xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-lg"
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
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        {auction.category || "Auction"}
                      </p>

                      <AuctionCountdown
                        endsAt={auction.endsAt}
                        status={auction.status}
                        compact
                      />
                    </div>

                    <h2 className="mt-3 line-clamp-2 text-lg font-bold text-slate-900">
                      {auction.title}
                    </h2>

                    <div className="mt-4 space-y-1 text-sm text-slate-600">
                      <p>
                        Current Bid:{" "}
                        <span className="font-bold text-slate-900">
                          ${Number(currentBid || 0).toFixed(2)}
                        </span>
                      </p>

                      {auction.buyoutPrice && (
                        <p>
                          Buyout:{" "}
                          <span className="font-bold text-orange-600">
                            ${Number(auction.buyoutPrice).toFixed(2)}
                          </span>
                        </p>
                      )}

                      <p>{auction.bids?.length || 0} bids</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </PageLayout>
  );
}