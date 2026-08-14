import api from "./api";

const macTakvimService = {
  // Seçilen günün favori maçlarını getirir (Tarih gönderilmezse bugünü alır)
  getGununMaclari: async (tarih = null) => {
    const response = await api.get("/MacTakvim/gunun-maclari", {
      params: { tarih }, // Backend'deki [FromQuery] parametresiyle eşleşir
    });
    return response.data;
  },

  // Tüm maçları listeler
  getTumMaclar: async () => {
    const response = await api.get("/MacTakvim/liste");
    return response.data;
  },

  // Mackolik'ten verileri çeker ve DB'yi günceller (Seçili tarih için)
  yenile: async (tarih = null) => {
    // Axios POST metodunda 2. parametre veri(body), 3. parametre ayarlardır(params)
    const response = await api.post("/MacTakvim/yenile", null, {
      params: { tarih },
    });
    return response.data;
  },

  // Hata Ayıklama (Debug) için: DB'ye yazmadan direkt api'den okur
  getCanliRawListe: async (tarih = null) => {
    const response = await api.get("/MacTakvim/direct-test", {
      params: { tarih },
    });
    return response.data;
  },
};

export default macTakvimService;
