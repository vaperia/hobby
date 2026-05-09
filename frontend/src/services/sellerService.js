import { api } from "../lib/api";

export const sellerService = {
  getDashboard: async () => {
    return api.get("/seller/dashboard");
  },

  getOrders: async () => {
    return api.get("/seller/orders");
  },

  getReports: async () => {
    return api.get("/seller/reports");
  },

  getShop: async () => {
    return api.get("/seller/shop");
  },

  updateOrderStatus: async (orderItemId, status) => {
    return api.patch(`/seller/order-items/${orderItemId}/status`, {
      status,
    });
  },
};