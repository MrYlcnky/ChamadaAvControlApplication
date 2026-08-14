import api from "./api";

const URL = "RemoteButton";

const remoteButtonService = {
  getAll: async () => {
    const response = await api.get(`${URL}/listele`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post(`${URL}/ekle`, data);
    return response.data;
  },
  update: async (data) => {
    const response = await api.put(`${URL}/guncelle`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`${URL}/sil/${id}`);
    return response.data;
  },
};

export default remoteButtonService;
