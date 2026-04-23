import { api } from "../lib/api";

export const orderService = {
  getMyOrders: async () => {
    return api.get("/orders");
  },

  getById: async (orderId) => {
    return api.get(`/orders/${orderId}`);
  },

  checkout: async (payload) => {
    return api.post("/checkout", payload);
  },
};