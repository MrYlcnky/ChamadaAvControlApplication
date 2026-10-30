import api from "./api";

const islemLogService = {
  listele: async (params, signal) => {
    const response = await api.get("/IslemLog/listele", {
      params,
      signal,
    });
    return response.data;
  },

  filtreSecenekleri: async () => {
    const response = await api.get("/IslemLog/filtre-secenekleri");
    return response.data;
  },
};

export default islemLogService;
