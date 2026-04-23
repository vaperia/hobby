import { api } from "../lib/api";

export const userService = {
  getProfile: async () => {
    return api.get("/users/me");
  },

  updateProfile: async (payload) => {
    return api.patch("/users/me", payload);
  },
};