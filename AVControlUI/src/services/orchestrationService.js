import api from "./api";

const URL = "Orchestration";

const orchestrationService = {
  // ------------------------------------------------------------
  // KAYNAK DEĞİŞTİR
  // ------------------------------------------------------------
  kaynakDegistir: async (data) => {
    const response = await api.post(`${URL}/kaynak-degistir`, data);
    return response.data;
  },

  // ------------------------------------------------------------
  // KANAL DEĞİŞTİR
  // ------------------------------------------------------------
  kanalDegistir: async (data) => {
    const response = await api.post(`${URL}/kanal-degistir`, data);
    return response.data;
  },

  // ------------------------------------------------------------
  // MEVCUT BÖLGE BAZLI TEKİL TUŞ GÖNDER
  // ------------------------------------------------------------
  tekilTusGonder: async (data) => {
    const response = await api.post(`${URL}/tekil-tus`, data);
    return response.data;
  },

  // ------------------------------------------------------------
  // IR SİNYAL ÖĞREN
  // ------------------------------------------------------------
  learnSignal: async (data) => {
    const response = await api.post(`${URL}/LearnSignal`, data);
    return response.data;
  },

  // ------------------------------------------------------------
  // MATRIX CANLI DURUM
  // ------------------------------------------------------------
  getMatrixDurum: async (matrixId) => {
    const response = await api.get(`${URL}/matrix-durum/${matrixId}`);
    return response.data;
  },

  // ------------------------------------------------------------
  // LED / VIPLEX MODU
  // ------------------------------------------------------------
  changeLedMode: async (data) => {
    const response = await api.post(`${URL}/manuel-led-modu`, data);
    return response.data;
  },

  // ------------------------------------------------------------
  // TOPLU KAYNAK DEĞİŞTİR
  // ------------------------------------------------------------
  topluKaynakDegistir: async (data) => {
    const response = await api.post(`${URL}/toplu-kaynak-degistir`, data);
    return response.data;
  },

  // ------------------------------------------------------------
  // KONTROL PANELİ BÖLGELERİ
  // ------------------------------------------------------------
  getKontrolPaneliBolgeler: async () => {
    const response = await api.get(`${URL}/kontrol-paneli-bolgeler`);
    return response.data;
  },

  // ------------------------------------------------------------
  // KONTROL PANELİ KUMANDALARI
  // ------------------------------------------------------------
  getKontrolPaneliKumandalar: async () => {
    const response = await api.get(`${URL}/kontrol-paneli-kumandalar`);
    return response.data;
  },

  // ------------------------------------------------------------
  // KONTROL PANELİ BAĞIMSIZ KUMANDA TUŞ GÖNDER
  // ------------------------------------------------------------
  kontrolPaneliKumandaTusGonder: async (data) => {
    const response = await api.post(
      `${URL}/kontrol-paneli-kumanda-tus-gonder`,
      data,
    );

    return response.data;
  },
};

export default orchestrationService;
