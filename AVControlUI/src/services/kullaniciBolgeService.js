import api from "./api";

const URL = "/KullaniciBolge";

const kullaniciBolgeService = {
  // Backend hedef KULLANICININ rolüne göre seçilebilir bölgeleri filtreler.
  // Admin hedefinde bütün bölgeler; normal kullanıcı hedefinde yalnızca
  // aktif ve bağlı LED işlemcisinde KullanicidaGosterilsinMi=true olan bölgeler.
  getBolgeler: async (kullaniciId, signal) => {
    const response = await api.get(`${URL}/bolgeler`, {
      params: { kullaniciId },
      signal,
    });
    return response.data;
  },

  // Eski / artık görünmez bölge atamaları dahil TÜM atanmış bölge ID'leri.
  getKullaniciYetkileri: async (kullaniciId, signal) => {
    const response = await api.get(`${URL}/kullanici/${kullaniciId}`, {
      signal,
    });
    return response.data;
  },

  // Backend seçilebilir bölüm atamalarını günceller ve
  // görünürlüğü sonradan kapanan eski atamaları korur.
  kaydet: async (kullaniciId, bolgeIds) => {
    const response = await api.put(`${URL}/kullanici/${kullaniciId}`, {
      bolgeIds,
    });
    return response.data;
  },
};

export default kullaniciBolgeService;
