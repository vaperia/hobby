import { api } from "../lib/api";

export const productService = {
  getAll: async (params = {}) => {
    const searchParams = new URLSearchParams();

    if (params.category) searchParams.append("category", params.category);
    if (params.search) searchParams.append("search", params.search);
    if (params.featured) searchParams.append("featured", "true");
    if (params.sort) searchParams.append("sort", params.sort);
    if (params.page) searchParams.append("page", params.page);
    if (params.limit) searchParams.append("limit", params.limit);

    const query = searchParams.toString();
    return api.get(`/products${query ? `?${query}` : ""}`);
  },

  getById: async (id) => {
    return api.get(`/products/${id}`);
  },

  create: async (productData) => {
    return api.post("/products", productData);
  },

  update: async (id, productData) => {
    return api.put(`/products/${id}`, productData);
  },

  remove: async (id) => {
    return api.delete(`/products/${id}`);
  },
};