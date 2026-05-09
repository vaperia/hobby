import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

function getUniqueBidderCount(bids = []) {
  const bidderIds = new Set();

  bids.forEach((bid) => {
    if (bid.bidderId) {
      bidderIds.add(bid.bidderId);
    }
  });

  return bidderIds.size;
}

function canOfferNextBidder(auction) {
  const uniqueBidderCount = getUniqueBidderCount(auction.bids || []);

  if (uniqueBidderCount === 0) {
    return false;
  }

  if (auction.winnerSource === "BUYOUT") {
    return uniqueBidderCount >= 1;
  }

  return uniqueBidderCount >= 2;
}

export default function ExpiredAuctionActions({ auction, onActionComplete }) {
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");

  const showOfferNextBidder = canOfferNextBidder(auction);

  async function runAction(action) {
    try {
      setLoadingAction(action);
      setError("");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/auctions/${auction.id}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `Failed to ${action} auction.`);
      }

      if (onActionComplete) {
        await onActionComplete();
      }
    } catch (err) {
      console.error(`${action} auction error:`, err);
      setError(err.message || `Failed to ${action} auction.`);
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {showOfferNextBidder && (
          <button
            type="button"
            disabled={loadingAction === "reallocate"}
            onClick={() => runAction("reallocate")}
            className="rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction === "reallocate"
              ? "Offering..."
              : "Offer Next Bidder"}
          </button>
        )}

        <Link
          to={`/seller/auctions/${auction.id}/repost`}
          className="rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          Repost Auction
        </Link>

        <Link
          to={`/seller/auctions/${auction.id}/convert-to-listing`}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Move to Marketplace
        </Link>
      </div>
    </div>
  );
}