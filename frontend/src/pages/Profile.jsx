import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString();
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2)}`;
}

function getInitials(name = "User") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SellerTypeBadge({ sellerType }) {
  const isShop = sellerType === "SHOP";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        isShop ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"
      }`}
    >
      {isShop ? "Shop Seller" : "Private Seller"}
    </span>
  );
}

function StatusBadge({ status }) {
  const cleanStatus = status || "ACTIVE";

  const colorClass =
    cleanStatus === "ACTIVE"
      ? "bg-green-50 text-green-700"
      : cleanStatus === "PAID"
      ? "bg-blue-50 text-blue-700"
      : cleanStatus === "AWAITING_PAYMENT"
      ? "bg-yellow-50 text-yellow-700"
      : cleanStatus === "EXPIRED_UNPAID"
      ? "bg-red-50 text-red-700"
      : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${colorClass}`}>
      {cleanStatus.replaceAll("_", " ")}
    </span>
  );
}

function PostedItemCard({ item }) {
  const isAuction = item.itemType === "AUCTION";
  const title = item.title || "Untitled Item";
  const price = isAuction ? item.currentBid || item.startingBid : item.price;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={title}
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="flex h-48 items-center justify-center bg-slate-100 text-sm text-slate-400">
          No image available
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isAuction
                ? "bg-purple-50 text-purple-700"
                : "bg-sky-50 text-sky-700"
            }`}
          >
            {isAuction ? "Auction" : "Marketplace"}
          </span>

          <SellerTypeBadge sellerType={item.sellerType} />

          {isAuction && <StatusBadge status={item.status} />}
        </div>

        <h3 className="mt-3 line-clamp-2 text-lg font-bold text-slate-900">
          {title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
          {item.description || "No description provided."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-400">
              {isAuction ? "Bid Price" : "Price"}
            </p>

            <p className="mt-1 font-bold text-slate-900">
              {formatMoney(price)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-400">Category</p>

            <p className="mt-1 font-bold text-slate-900">
              {item.category || "N/A"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={isAuction ? `/auctions/${item.id}` : `/products/${item.id}`}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            View
          </Link>

          <Link
            to={
              isAuction
                ? `/seller/auctions/${item.id}/edit`
                : `/seller/products/${item.id}/edit`
            }
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>

          {!isAuction && (
            <Link
              to={`/seller/products/${item.id}/convert-to-auction`}
              className="rounded-lg border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
            >
              Move to Auction
            </Link>
          )}

          {isAuction && (
            <Link
              to={`/seller/auctions/${item.id}/convert-to-listing`}
              className="rounded-lg border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
            >
              Move to Marketplace
            </Link>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Posted on {formatDate(item.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [listings, setListings] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const displayName = user?.username || user?.name || "User";
  const profileImage = user?.profileImage || user?.profilePic || user?.avatar;
  const sellerType =
    user?.role === "seller" || user?.role === "admin" ? "SHOP" : "PRIVATE";

  function handleLogout() {
    logout();
    navigate("/");
  }

  useEffect(() => {
    async function loadProfileDashboard() {
      setLoading(true);
      setError("");

      try {
        const [myListings, myAuctions, myOrders] = await Promise.all([
          api.get("/products/seller/my-listings"),
          api.get("/auctions/seller/my-auctions"),
          api.get("/orders"),
        ]);

        setListings(Array.isArray(myListings) ? myListings : []);
        setAuctions(Array.isArray(myAuctions) ? myAuctions : []);
        setOrders(Array.isArray(myOrders) ? myOrders : []);
      } catch (err) {
        console.error("Load profile dashboard error:", err);
        setError(err.message || "Failed to load your profile dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadProfileDashboard();
  }, []);

  const allItems = useMemo(() => {
    const listingItems = listings.map((listing) => ({
      ...listing,
      itemType: "LISTING",
    }));

    const auctionItems = auctions.map((auction) => ({
      ...auction,
      itemType: "AUCTION",
    }));

    return [...listingItems, ...auctionItems].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [listings, auctions]);

  const filteredItems = useMemo(() => {
    if (activeTab === "marketplace") {
      return allItems.filter((item) => item.itemType === "LISTING");
    }

    if (activeTab === "auctions") {
      return allItems.filter((item) => item.itemType === "AUCTION");
    }

    return allItems;
  }, [activeTab, allItems]);

  return (
    <PageLayout>
      <main className="min-h-screen bg-sky-50 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <section className="overflow-hidden rounded-3xl bg-white shadow-md">
            <div className="bg-gradient-to-r from-purple-700 via-blue-600 to-sky-500 px-8 py-10 text-white">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={displayName}
                      className="h-24 w-24 rounded-full border-4 border-white object-cover shadow"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white/20 text-3xl font-black shadow">
                      {getInitials(displayName)}
                    </div>
                  )}

                  <div>
                    <h1 className="text-3xl font-black">{displayName}</h1>

                    <p className="mt-1 text-sm text-white/80">
                      {user?.email || "No email found"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900">
                        {sellerType === "SHOP"
                          ? "Shop Seller"
                          : "Private Seller"}
                      </span>

                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
                        Role: {user?.role || "buyer"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4">
                  <div className="rounded-2xl bg-white/15 px-5 py-4">
                    <p className="text-2xl font-black">{allItems.length}</p>
                    <p className="text-xs text-white/80">Total Posted</p>
                  </div>

                  <div className="rounded-2xl bg-white/15 px-5 py-4">
                    <p className="text-2xl font-black">{listings.length}</p>
                    <p className="text-xs text-white/80">Marketplace</p>
                  </div>

                  <div className="rounded-2xl bg-white/15 px-5 py-4">
                    <p className="text-2xl font-black">{auctions.length}</p>
                    <p className="text-xs text-white/80">Auctions</p>
                  </div>

                  <div className="rounded-2xl bg-white/15 px-5 py-4">
                    <p className="text-2xl font-black">{orders.length}</p>
                    <p className="text-xs text-white/80">Orders</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 bg-white px-8 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Profile Dashboard
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your account, orders, marketplace listings, and
                    auctions.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/create-listing"
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                  >
                    Sell Item
                  </Link>

                  <Link
                    to="/create-auction"
                    className="rounded-xl bg-gradient-to-r from-purple-700 to-sky-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Create Auction
                  </Link>

                  <Link
                    to="/orders"
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    My Orders
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    activeTab === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Posted Items
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("marketplace")}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    activeTab === "marketplace"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Marketplace
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("auctions")}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    activeTab === "auctions"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Auctions
                </button>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="font-semibold text-slate-600">
                Loading your profile dashboard...
              </p>
            </div>
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
              <h3 className="text-xl font-black text-slate-900">
                No posted items yet
              </h3>

              <p className="mt-2 text-slate-500">
                Start by creating a marketplace listing or auction.
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <Link
                  to="/create-listing"
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Sell Item
                </Link>

                <Link
                  to="/create-auction"
                  className="rounded-xl bg-gradient-to-r from-purple-700 to-sky-500 px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  Create Auction
                </Link>
              </div>
            </div>
          ) : (
            <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <PostedItemCard
                  key={`${item.itemType}-${item.id}`}
                  item={item}
                />
              ))}
            </section>
          )}
        </div>
      </main>
    </PageLayout>
  );
}