import { api } from "../lib/api";

export const sellerService = {
  getDashboard: async () => {
    return api.get("/seller/dashboard");
  },
};