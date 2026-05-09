import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import AuctionCountdown from "../components/AuctionCountdown";
import { auctionService } from "../services/auctionService";
import { useAuth } from "../context/AuthContext";

function formatStatus(status) {
  if (!status) return "Active";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function maskBidderUsername(bidder) {
  const username = bidder?.username || "Unknown User";

  if (username === "Unknown User") return username;

  if (username.length <= 2) {
    return `${username[0] || "u"}***`;
  }

  const visibleStart = username.slice(0, 2);
  const visibleEnd = username.slice(-1);

  return `${visibleStart}***${visibleEnd}`;
}

export default function AuctionDetails() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [agreement, setAgreement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentUserId = user?.id || user?.userId;
  const isSeller = auction?.sellerId === currentUserId;
  const isWinner = auction?.winnerId === currentUserId;

  const currentBid = auction?.currentBid || auction?.startingBid || 0;

  const minimumBid = useMemo(() => {
    if (!auction) return 0;

    const base = auction.currentBid || auction.startingBid;
    return Number(base || 0) + Number(auction.bidIncrement || 1);
  }, [auction]);

  const minimumAddAmount = useMemo(() => {
    if (!auction) return 1;

    return Number(auction.bidIncrement || 1);
  }, [auction]);

  const previewNewBid = useMemo(() => {
    return Number(currentBid || 0) + Number(bidAmount || 0);
  }, [currentBid, bidAmount]);

  const loadAuction = useCallback(
    async (options = {}) => {
      const silent = options.silent || false;

      try {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        const data = await auctionService.getById(id);

        setAuction(data);
        setBidAmount("");
        setAgreement(false);
      } catch (err) {
        console.error("Load auction error:", err);
        setError(err.message || "Failed to load auction.");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [id]
  );

  useEffect(() => {
    loadAuction();
  }, [loadAuction]);

  async function handlePlaceBid(e) {
    e.preventDefault();

    if (!isAuthenticated) {
      setError("Please log in to place a bid.");
      return;
    }

    if (!agreement) {
      setError("Please agree to complete payment if you win.");
      return;
    }

    const amountToAdd = Number(bidAmount);

    if (!amountToAdd || amountToAdd <= 0) {
      setError("Please enter an amount greater than 0.");
      return;
    }

    if (amountToAdd < minimumAddAmount) {
      setError(`Minimum amount to add is $${minimumAddAmount.toFixed(2)}.`);
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      await auctionService.placeBid(id, amountToAdd);

      setMessage("Bid placed successfully.");
      await loadAuction({ silent: true });
    } catch (err) {
      console.error("Place bid error:", err);
      setError(err.message || "Failed to place bid.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBuyout() {
    if (!isAuthenticated) {
      setError("Please log in to use buyout.");
      return;
    }

    const confirmBuyout = window.confirm(
      `Buyout this auction for $${Number(auction.buyoutPrice).toFixed(
        2
      )}? You will have 3 days to complete payment.`
    );

    if (!confirmBuyout) return;

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      await auctionService.buyout(id);

      setMessage(
        "Buyout successful. The auction item has been added to your cart."
      );
      await loadAuction({ silent: true });
    } catch (err) {
      console.error("Buyout error:", err);
      setError(err.message || "Failed to buyout auction.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-7xl px-6 py-16">
          Loading auction...
        </main>
      </PageLayout>
    );
  }

  if (!auction) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-7xl px-6 py-16">
          Auction not found.
        </main>
      </PageLayout>
    );
  }

  const active = auction.status === "ACTIVE";

  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-6 py-16">
        <Link to="/auctions" className="font-semibold text-blue-600">
          ← Back to Auctions
        </Link>

        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            {auction.imageUrl ? (
              <img
                src={auction.imageUrl}
                alt={auction.title}
                className="h-[420px] w-full rounded-xl bg-slate-100 object-contain"
              />
            ) : (
              <div className="flex h-[420px] w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                No Image
              </div>
            )}

            <h1 className="mt-6 text-4xl font-black text-slate-900">
              {auction.title}
            </h1>

            <p className="mt-4 leading-7 text-slate-600">
              {auction.description || "No description provided."}
            </p>
          </section>

          <aside className="h-fit rounded-2xl bg-white p-6 shadow-md">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                {formatStatus(auction.status)}
              </span>

              <AuctionCountdown
                endsAt={auction.endsAt}
                status={auction.status}
                onEnd={() => loadAuction({ silent: true })}
              />
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500">Current Bid</p>
                <p className="text-4xl font-black text-slate-900">
                  ${Number(currentBid || 0).toFixed(2)}
                </p>
              </div>

              {active && (
                <>
                  <div>
                    <p className="text-sm text-slate-500">Minimum Next Bid</p>
                    <p className="text-xl font-bold text-slate-900">
                      ${Number(minimumBid || 0).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Minimum Amount to Add
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      ${Number(minimumAddAmount || 1).toFixed(2)}
                    </p>
                  </div>
                </>
              )}

              {auction.buyoutPrice && active && !isSeller && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleBuyout}
                  className="w-full rounded-md bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  Buyout Now for ${Number(auction.buyoutPrice).toFixed(2)}
                </button>
              )}

              {active && !isSeller && (
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Amount to Add
                    </label>

                    <input
                      type="number"
                      min={minimumAddAmount}
                      step={minimumAddAmount}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Add at least $${minimumAddAmount.toFixed(
                        2
                      )}`}
                      className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                      required
                    />

                    {bidAmount && Number(bidAmount) > 0 && (
                      <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                        <p>
                          Current bid:{" "}
                          <span className="font-bold">
                            ${Number(currentBid || 0).toFixed(2)}
                          </span>
                        </p>

                        <p>
                          You are adding:{" "}
                          <span className="font-bold">
                            ${Number(bidAmount || 0).toFixed(2)}
                          </span>
                        </p>

                        <p>
                          Your new bid will be:{" "}
                          <span className="font-bold">
                            ${Number(previewNewBid || 0).toFixed(2)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <label className="flex gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={agreement}
                      onChange={(e) => setAgreement(e.target.checked)}
                    />
                    I understand that if I win, I am expected to complete
                    payment within 3 days.
                  </label>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full rounded-md bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {actionLoading ? "Placing Bid..." : "Place Bid"}
                  </button>
                </form>
              )}

              {isSeller && (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  You are the seller of this auction.
                </div>
              )}

              {auction.status === "AWAITING_PAYMENT" && isWinner && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="font-bold text-green-700">
                    You won this auction.
                  </p>

                  <p className="mt-1 text-sm text-green-700">
                    This auction has been added to your cart.
                  </p>

                  {auction.paymentDueAt && (
                    <p className="mt-1 text-sm text-green-700">
                      Payment due by{" "}
                      {new Date(auction.paymentDueAt).toLocaleString()}.
                    </p>
                  )}

                  <Link
                    to="/cart"
                    className="mt-4 block w-full rounded-md bg-green-600 py-3 text-center font-semibold text-white hover:bg-green-700"
                  >
                    Go to Cart to Pay
                  </Link>
                </div>
              )}

              {auction.status === "AWAITING_PAYMENT" && !isWinner && (
                <p className="rounded-xl bg-yellow-50 p-4 text-sm text-yellow-700">
                  This auction is awaiting payment from the current winner.
                </p>
              )}

              {auction.status === "PAID" && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="font-bold text-green-700">Payment completed.</p>

                  <p className="mt-1 text-sm text-green-700">
                    This auction has been paid successfully.
                  </p>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4 text-sm text-slate-500">
                <p>
                  Seller:{" "}
                  {auction.seller?.username || auction.seller?.email || "-"}
                </p>
                <p>Category: {auction.category || "-"}</p>
                <p>Condition: {auction.condition || "-"}</p>
                <p>Total Bids: {auction.bids?.length || 0}</p>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-10 rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900">Bid History</h2>

          {auction.bids?.length === 0 ? (
            <p className="mt-4 text-slate-600">No bids yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {auction.bids.map((bid) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {maskBidderUsername(bid.bidder)}
                    </p>

                    <p className="text-sm text-slate-400">
                      {new Date(bid.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <p className="font-bold text-slate-900">
                    ${Number(bid.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </PageLayout>
  );
}