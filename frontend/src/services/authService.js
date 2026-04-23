import { api } from "../lib/api";

export const authService = {
  register: async ({ username, email, password, role = "buyer" }) => {
    return api.post("/auth/register", {
      username,
      email,
      password,
      role,
    });
  },

  login: async ({ email, password }) => {
    return api.post("/auth/login", {
      email,
      password,
    });
  },

  getMe: async () => {
    return api.get("/auth/me");
  },
};