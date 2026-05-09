import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import AuctionCountdown from "../components/AuctionCountdown";
import ExpiredAuctionActions from "../components/ExpiredAuctionActions";
import { auctionService } from "../services/auctionService";

const API_BASE = "http://localhost:5000/api";

function formatStatus(status) {
  if (!status) return "Active";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function hasAuctionEnded(auction) {
  return auction.endsAt && new Date(auction.endsAt) <= new Date();
}

function hasEndedWithoutBids(auction) {
  return (
    hasAuctionEnded(auction) &&
    auction.status === "ACTIVE" &&
    (!auction.bids || auction.bids.length === 0)
  );
}

function isPaymentOverdueOrForfeited(auction) {
  return (
    auction.status === "EXPIRED_UNPAID" ||
    hasEndedWithoutBids(auction) ||
    (auction.status === "AWAITING_PAYMENT" &&
      auction.paymentDueAt &&
      new Date(auction.paymentDueAt) < new Date())
  );
}

function getStatusBadgeClass(auction, overdueOrForfeited) {
  if (auction.completedOrderStatus === "completed") {
    return "bg-green-100 text-green-700";
  }

  if (auction.completedOrderStatus === "collected") {
    return "bg-green-100 text-green-700";
  }

  if (auction.status === "PAID") {
    return "bg-green-100 text-green-700";
  }

  if (auction.status === "EXPIRED_UNPAID" || hasEndedWithoutBids(auction)) {
    return "bg-orange-100 text-orange-700";
  }

  if (overdueOrForfeited) {
    return "bg-red-100 text-red-700";
  }

  return "bg-blue-100 text-blue-700";
}

function getStatusText(auction, overdueOrForfeited) {
  if (auction.completedOrderStatus === "completed") {
    return "Order Completed";
  }

  if (auction.completedOrderStatus === "collected") {
    return "Order Collected";
  }

  if (auction.status === "EXPIRED_UNPAID" || hasEndedWithoutBids(auction)) {
    return "Auction Ended";
  }

  if (overdueOrForfeited) {
    return "Payment Overdue";
  }

  return formatStatus(auction.status);
}

function canEditAuction(auction) {
  const auctionEnded = hasAuctionEnded(auction);

  return !auctionEnded && auction.status === "ACTIVE";
}

function canMarkCompleted(auction) {
  return (
    auction.status === "PAID" &&
    auction.completedOrderStatus !== "completed" &&
    auction.completedOrderStatus !== "collected"
  );
}

export default function SellerAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAuctions = useCallback(async (options = {}) => {
    const silent = options.silent || false;

    try {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      const data = await auctionService.getSellerAuctions();
      setAuctions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load seller auctions error:", err);
      setError(err.message || "Failed to load seller auctions.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadAuctions();
  }, [loadAuctions]);

  async function handleDelete(id) {
    const confirmDelete = window.confirm(
      "Delete this auction posting? This removes the auction listing from your seller auction page."
    );

    if (!confirmDelete) return;

    try {
      setActionId(id);
      setError("");
      setMessage("");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/auctions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete auction posting.");
      }

      setMessage("Auction posting deleted.");
      await loadAuctions({ silent: true });
    } catch (err) {
      console.error("Delete auction error:", err);
      setError(err.message || "Failed to delete auction posting.");
    } finally {
      setActionId("");
    }
  }

  async function handleCompleteAuctionOrder(id) {
    const confirmComplete = window.confirm(
      "Mark this auction order as completed?"
    );

    if (!confirmComplete) return;

    try {
      setActionId(id);
      setError("");
      setMessage("");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/auctions/${id}/complete-order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to complete auction order.");
      }

      setMessage("Auction order marked as completed.");
      await loadAuctions({ silent: true });
    } catch (err) {
      console.error("Complete auction order error:", err);
      setError(err.message || "Failed to complete auction order.");
    } finally {
      setActionId("");
    }
  }

  async function handleActionComplete() {
    setMessage("Auction updated successfully.");
    await loadAuctions({ silent: true });
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
              Manage auction listings, payment deadlines, completed auction
              orders, and forfeited payments.
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
              <table className="w-full min-w-[1300px] border-collapse">
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

                    const overdueOrForfeited =
                      isPaymentOverdueOrForfeited(auction);

                    const showExpiredActions =
                      overdueOrForfeited || hasEndedWithoutBids(auction);

                    const showDeleteButton =
                      auction.canDeletePosting || hasEndedWithoutBids(auction);

                    return (
                      <tr
                        key={auction.id}
                        className="border-b border-slate-100 align-top"
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
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
                              auction,
                              overdueOrForfeited
                            )}`}
                          >
                            {getStatusText(auction, overdueOrForfeited)}
                          </span>
                        </td>

                        <td className="py-4">
                          <AuctionCountdown
                            endsAt={auction.endsAt}
                            status={auction.status}
                            compact
                            onEnd={() => loadAuctions({ silent: true })}
                          />
                        </td>

                        <td className="py-4 text-slate-700">
                          {auction.paymentDueAt
                            ? new Date(auction.paymentDueAt).toLocaleString()
                            : "-"}
                        </td>

                        <td className="py-4">
                          <div className="flex flex-wrap items-center gap-2">
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

                            {canMarkCompleted(auction) && (
                              <button
                                type="button"
                                disabled={actionId === auction.id}
                                onClick={() =>
                                  handleCompleteAuctionOrder(auction.id)
                                }
                                className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {actionId === auction.id
                                  ? "Updating..."
                                  : "Mark Completed"}
                              </button>
                            )}

                            {showExpiredActions && (
                              <ExpiredAuctionActions
                                auction={auction}
                                onActionComplete={handleActionComplete}
                              />
                            )}

                            {showDeleteButton && (
                              <button
                                type="button"
                                disabled={actionId === auction.id}
                                onClick={() => handleDelete(auction.id)}
                                className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {actionId === auction.id
                                  ? "Deleting..."
                                  : "Delete Posting"}
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