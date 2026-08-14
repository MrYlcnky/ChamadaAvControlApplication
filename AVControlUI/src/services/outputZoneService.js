import api from "./api";

const outputZoneService = {
  tumunuGetir: async () => {
    const response = await api.get("/OutputZone/listele");
    return response.data;
  },

  ekle: async (data) => {
    // data: { matrixDeviceId, ledProcessorId, portKodu, bolgeAdi }
    const response = await api.post("/OutputZone/ekle", data);
    return response.data;
  },

  guncelle: async (data) => {
    const response = await api.put("/OutputZone/guncelle", data);
    return response.data;
  },

  sil: async (id) => {
    const response = await api.delete(`/OutputZone/sil/${id}`);
    return response.data;
  },
};

export default outputZoneService;
