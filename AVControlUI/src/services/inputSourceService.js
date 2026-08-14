import api from "./api";

const inputSourceService = {
  tumunuGetir: async () => {
    const response = await api.get("/InputSource/listele");
    return response.data;
  },

  ekle: async (data) => {
    // data: { inputName, matrixDeviceId, remoteControlId, irTransmitterId, portNumarasi, kanalKontrolVarMi, aktifMi }
    const response = await api.post("/InputSource/ekle", data);
    return response.data;
  },

  guncelle: async (data) => {
    const response = await api.put("/InputSource/guncelle", data);
    return response.data;
  },

  sil: async (id) => {
    const response = await api.delete(`/InputSource/sil/${id}`);
    return response.data;
  },
};

export default inputSourceService;
