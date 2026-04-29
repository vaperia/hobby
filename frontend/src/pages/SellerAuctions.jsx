import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import AuctionCountdown from "../components/AuctionCountdown";
import { auctionService } from "../services/auctionService";

function formatStatus(status) {
  if (!status) return "Active";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function isPaymentOverdue(auction) {
  return (
    auction.status === "AWAITING_PAYMENT" &&
    auction.paymentDueAt &&
    new Date(auction.paymentDueAt) < new Date()
  );
}

function canEditAuction(auction) {
  return auction.status !== "PAID" && auction.status !== "AWAITING_PAYMENT";
}

export default function SellerAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadAuctions() {
    try {
      setLoading(true);
      setError("");

      const data = await auctionService.getSellerAuctions();
      setAuctions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load seller auctions error:", err);
      setError(err.message || "Failed to load seller auctions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuctions();
  }, []);

  async function handleReallocate(id) {
    try {
      setActionId(id);
      setError("");
      setMessage("");

      await auctionService.reallocate(id);

      setMessage("Auction offered to next highest bidder.");
      await loadAuctions();
    } catch (err) {
      console.error("Reallocate auction error:", err);
      setError(err.message || "Failed to reallocate auction.");
    } finally {
      setActionId("");
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm(
      "Delete this auction? You can only delete auctions with no bids."
    );

    if (!confirmDelete) return;

    try {
      setActionId(id);
      setError("");
      setMessage("");

      await auctionService.remove(id);

      setMessage("Auction deleted.");
      await loadAuctions();
    } catch (err) {
      console.error("Delete auction error:", err);
      setError(err.message || "Failed to delete auction.");
    } finally {
      setActionId("");
    }
  }

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900">
              Seller Auctions
            </h1>

            <p className="mt-2 text-slate-500">
              Manage auction listings, payment deadlines, and reallocations.
            </p>
          </div>

          <Link
            to="/seller/auctions/new"
            className="rounded-md bg-gradient-to-r from-purple-700 via-blue-600 to-orange-500 px-5 py-3 font-semibold text-white hover:opacity-95"
          >
            Create Auction
          </Link>
        </div>

        {error && (
          <div className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-8 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <section className="mt-8 rounded-2xl bg-white p-8 shadow-md">
          {loading ? (
            <p className="text-slate-600">Loading auctions...</p>
          ) : auctions.length === 0 ? (
            <p className="text-slate-600">You have no auctions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                    <th className="pb-3 font-semibold">Auction</th>
                    <th className="pb-3 font-semibold">Current Bid</th>
                    <th className="pb-3 font-semibold">Buyout</th>
                    <th className="pb-3 font-semibold">Bids</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Time Left</th>
                    <th className="pb-3 font-semibold">Payment Due</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {auctions.map((auction) => {
                    const currentBid =
                      auction.currentBid || auction.startingBid || 0;

                    const overdue = isPaymentOverdue(auction);

                    return (
                      <tr
                        key={auction.id}
                        className="border-b border-slate-100"
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            {auction.imageUrl ? (
                              <img
                                src={auction.imageUrl}
                                alt={auction.title}
                                className="h-12 w-12 rounded-lg bg-slate-100 object-contain"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                                No Image
                              </div>
                            )}

                            <div>
                              <p className="font-semibold text-slate-900">
                                {auction.title}
                              </p>

                              <p className="text-xs text-slate-400">
                                {auction.category || "-"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 font-semibold text-slate-900">
                          ${Number(currentBid).toFixed(2)}
                        </td>

                        <td className="py-4 text-slate-700">
                          {auction.buyoutPrice
                            ? `$${Number(auction.buyoutPrice).toFixed(2)}`
                            : "-"}
                        </td>

                        <td className="py-4 text-slate-700">
                          {auction.bids?.length || 0}
                        </td>

                        <td className="py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${
                              overdue
                                ? "bg-red-100 text-red-700"
                                : auction.status === "PAID"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {overdue
                              ? "Payment Overdue"
                              : formatStatus(auction.status)}
                          </span>
                        </td>

                        <td className="py-4">
                          <AuctionCountdown
                            endsAt={auction.endsAt}
                            status={auction.status}
                            compact
                            onEnd={loadAuctions}
                          />
                        </td>

                        <td className="py-4 text-slate-700">
                          {auction.paymentDueAt
                            ? new Date(auction.paymentDueAt).toLocaleString()
                            : "-"}
                        </td>

                        <td className="py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/auctions/${auction.id}`}
                              className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              View
                            </Link>

                            {canEditAuction(auction) && (
                              <Link
                                to={`/seller/auctions/${auction.id}/edit`}
                                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                              >
                                Edit
                              </Link>
                            )}

                            {overdue && (
                              <button
                                type="button"
                                disabled={actionId === auction.id}
                                onClick={() => handleReallocate(auction.id)}
                                className="rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                              >
                                Offer to Next Bidder
                              </button>
                            )}

                            {auction.bids?.length === 0 &&
                              auction.status === "ACTIVE" && (
                                <button
                                  type="button"
                                  disabled={actionId === auction.id}
                                  onClick={() => handleDelete(auction.id)}
                                  className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                                >
                                  Delete
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </PageLayout>
  );
}