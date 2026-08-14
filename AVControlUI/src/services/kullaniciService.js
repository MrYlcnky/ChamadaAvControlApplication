import api from "./api";

const KULLANICI_URL = "Kullanici";

const kullaniciService = {
  // Tüm kullanıcıları getir
  getAll: async () => {
    const response = await api.get(`${KULLANICI_URL}/listele`);
    return response.data;
  },

  // Yeni kullanıcı ekle
  create: async (kullaniciData) => {
    const response = await api.post(`${KULLANICI_URL}/ekle`, kullaniciData);
    return response.data;
  },

  // Kullanıcıyı güncelle (Artık URL'de ID yok, verinin içinde gidiyor)
  update: async (kullaniciData) => {
    const response = await api.put(`${KULLANICI_URL}/guncelle`, kullaniciData);
    return response.data;
  },

  // Kullanıcıyı sil
  delete: async (id) => {
    const response = await api.delete(`${KULLANICI_URL}/sil/${id}`);
    return response.data;
  },
};

export default kullaniciService;
