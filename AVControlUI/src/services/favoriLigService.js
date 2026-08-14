import api from "./api";

const favoriLigService = {
  getAll: async () => {
    const response = await api.get("/FavoriLig/liste");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/FavoriLig/getir/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post("/FavoriLig/ekle", data);
    return response.data;
  },
  update: async (data) => {
    const response = await api.put("/FavoriLig/guncelle", data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/FavoriLig/sil/${id}`);
    return response.data;
  },
};

export default favoriLigService;
