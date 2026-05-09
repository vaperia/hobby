import { api } from "../lib/api";

export const auctionService = {
  getAll: async (params = {}) => {
    const searchParams = new URLSearchParams();

    if (params.category) searchParams.append("category", params.category);
    if (params.search) searchParams.append("search", params.search);
    if (params.status) searchParams.append("status", params.status);

    const query = searchParams.toString();

    return api.get(`/auctions${query ? `?${query}` : ""}`);
  },

  getById: async (id) => {
    return api.get(`/auctions/${id}`);
  },

  create: async (auctionData) => {
    return api.post("/auctions", auctionData);
  },

  update: async (auctionId, auctionData) => {
    return api.put(`/auctions/${auctionId}`, auctionData);
  },

  getSellerAuctions: async () => {
    return api.get("/auctions/seller/my-auctions");
  },

  placeBid: async (auctionId, amountToAdd) => {
    return api.post(`/auctions/${auctionId}/bids`, {
      amountToAdd,
    });
  },

  buyout: async (auctionId) => {
    return api.post(`/auctions/${auctionId}/buyout`);
  },

  endAuction: async (auctionId) => {
    return api.post(`/auctions/${auctionId}/end`);
  },

  reallocate: async (auctionId) => {
    return api.post(`/auctions/${auctionId}/reallocate`);
  },

  markPaid: async (auctionId) => {
    return api.post(`/auctions/${auctionId}/mark-paid`);
  },

  remove: async (auctionId) => {
    return api.delete(`/auctions/${auctionId}`);
  },
};