import api from "./api";

const favoriTakimService = {
  getAll: async () => {
    const response = await api.get("/FavoriTakim/liste");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/FavoriTakim/getir/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post("/FavoriTakim/ekle", data);
    return response.data;
  },
  update: async (data) => {
    const response = await api.put("/FavoriTakim/guncelle", data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/FavoriTakim/sil/${id}`);
    return response.data;
  },
};

export default favoriTakimService;
