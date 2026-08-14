import api from "./api";

const channelListService = {
  getAll: async () => {
    const response = await api.get("/ChannelList/listele");
    return response.data;
  },
  create: async (data) => {
    const response = await api.post("/ChannelList/ekle", data);
    return response.data;
  },
  update: async (data) => {
    const response = await api.put("/ChannelList/guncelle", data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/ChannelList/sil/${id}`);
    return response.data;
  },
};

export default channelListService;
