import { api } from "../lib/api";

export const cartService = {
  getCart: async () => {
    return api.get("/cart");
  },

  addItem: async ({ productId, quantity = 1 }) => {
    return api.post("/cart/items", {
      productId,
      quantity,
    });
  },

  updateItem: async (itemId, quantity) => {
    return api.patch(`/cart/items/${itemId}`, {
      quantity,
    });
  },

  removeItem: async (itemId) => {
    return api.delete(`/cart/items/${itemId}`);
  },

  clearCart: async () => {
    return api.delete("/cart");
  },

  checkout: async (checkoutData) => {
    return api.post("/checkout", checkoutData);
  },
};