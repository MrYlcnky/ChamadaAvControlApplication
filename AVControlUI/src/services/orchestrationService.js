import api from "./api";

// URL'i tanımladık ki 404 hatası almayalım!
const URL = "Orchestration";

const orchestrationService = {
  // Artık params kullanmıyoruz, veriyi direkt (JSON Body olarak) yolluyoruz
  kaynakDegistir: async (data) => {
    const response = await api.post(`${URL}/kaynak-degistir`, data);
    return response.data;
  },

  kanalDegistir: async (data) => {
    const response = await api.post(`${URL}/kanal-degistir`, data);
    return response.data;
  },

  tekilTusGonder: async (data) => {
    const response = await api.post(`${URL}/tekil-tus`, data);
    return response.data;
  },

  learnSignal: async (data) => {
    const response = await api.post(`${URL}/LearnSignal`, data);
    return response.data;
  },

  getMatrixDurum: async (matrixId) => {
    const response = await api.get(`${URL}/matrix-durum/${matrixId}`);
    return response.data;
  },

  changeLedMode: async (data) => {
    const response = await api.post(`${URL}/manuel-led-modu`, data);
    return response.data;
  },
  topluKaynakDegistir: async (data) => {
    const response = await api.post(`${URL}/toplu-kaynak-degistir`, data);
    return response.data;
  },
  getKontrolPaneliBolgeler: async () => {
    const response = await api.get(`${URL}/kontrol-paneli-bolgeler`);
    return response.data;
  },
};

export default orchestrationService;
