import api from "./api";

const URL = "MatrixDevice";

// Verileri FormData'ya çeviren yardımcı fonksiyon
const createFormData = (data) => {
  const formData = new FormData();
  for (const key in data) {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  }
  return formData;
};

const matrixService = {
  getAll: async () => {
    const response = await api.get(`${URL}/listele`);
    return response.data;
  },
  create: async (data) => {
    const formData = createFormData(data);
    const response = await api.post(`${URL}/ekle`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  update: async (data) => {
    const formData = createFormData(data);
    const response = await api.put(`${URL}/guncelle`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`${URL}/sil/${id}`);
    return response.data;
  },
  getLiveStatus: async (matrixId) => {
    const response = await api.get(`/Orchestration/matrix-durum/${matrixId}`);
    return response.data;
  },
};

export default matrixService;
