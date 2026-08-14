import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTv,
  faPlus,
  faMicrochip,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

import channelListService from "../services/channelListService";
import inputSourceService from "../services/inputSourceService";
import ChannelModal from "../components/kanallar/ChannelModal";
import ChannelDataTable from "../components/kanallar/ChannelDataTable";

const ChannelList = () => {
  const [channels, setChannels] = useState([]);
  const [inputSources, setInputSources] = useState([]);

  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal Yönetimi State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [channelData, inputData] = await Promise.all([
        channelListService.getAll(),
        inputSourceService.tumunuGetir(),
      ]);

      const safeChannels = Array.isArray(channelData) ? channelData : [];
      const safeInputs = Array.isArray(inputData) ? inputData : [];

      setChannels(safeChannels);
      setInputSources(safeInputs);

      if (safeInputs.length > 0 && !selectedSourceId) {
        setSelectedSourceId(safeInputs[0].id);
      }
    } catch (error) {
      toast.error("Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const filteredChannels = channels.filter(
    (c) => c.inputSourceId === selectedSourceId,
  );
  const activeSource = inputSources.find((s) => s.id === selectedSourceId);

  const openModal = (item = null) => {
    if (!selectedSourceId) {
      toast.warning("Lütfen önce yukarıdan bir kaynak (cihaz) seçin.");
      return;
    }
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu kanal silinecek ve geri alınamaz.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, Sil",
      cancelButtonText: "İptal",
      background: "#0f172a",
      color: "#e5e7eb",
      customClass: {
        popup: "rounded-3xl border border-slate-700 shadow-2xl",
        confirmButton:
          "rounded-xl px-5 py-2 font-bold bg-red-500 hover:bg-red-600",
        cancelButton:
          "rounded-xl px-5 py-2 font-bold bg-slate-700 hover:bg-slate-600",
      },
    });

    if (result.isConfirmed) {
      try {
        await channelListService.delete(id);
        toast.success("Kanal silindi.");
        await fetchData();
      } catch (err) {
        toast.error("Silme işlemi başarısız.");
      }
    }
  };

  return (
    <div className="space-y-8 animate-av-card-enter pt-2">
      {/* 1. ÜST BİLGİ (HEADER) - Kutu kaldırıldı, modern "Floating" tasarıma geçildi */}
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end px-2">
        <div className="flex items-center gap-5">
          {/* Parlayan estetik ikon */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/50 border border-slate-700/50 text-cyan-400 shadow-inner overflow-hidden">
            <div className="absolute inset-0 bg-cyan-400/10 blur-md"></div>
            <FontAwesomeIcon
              icon={faTv}
              className="relative z-10 text-2xl drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
            />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide text-white">
              Kanal Yönetimi
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-400">
              Cihaz bazlı kanal ve frekans listelerini organize edin.
            </p>
          </div>
        </div>

        <button
          onClick={() => openModal()}
          disabled={!selectedSourceId}
          className="group flex items-center gap-2.5 rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition-all duration-300 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          <FontAwesomeIcon
            icon={faPlus}
            className="transition-transform group-hover:rotate-90"
          />
          <span>Yeni Kanal Ekle</span>
        </button>
      </div>

      {/* 2. CİHAZ (KAYNAK) SEKMELERİ */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin scrollbar-track-slate-800/40 scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500">
          {inputSources.length === 0 && !loading ? (
            <div className="flex w-full flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-slate-700/80 bg-slate-900/50 p-10 text-slate-400">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="text-4xl text-slate-500/50 mb-2"
              />
              <p className="text-lg font-medium text-slate-300">
                Sistemde henüz bir cihaz bulunmuyor.
              </p>
              <p className="text-sm">
                Kanal ekleyebilmek için önce "Giriş Kaynağı" tanımlamalısınız.
              </p>
            </div>
          ) : (
            inputSources.map((source) => {
              const isActive = selectedSourceId === source.id;
              return (
                <button
                  key={source.id}
                  onClick={() => setSelectedSourceId(source.id)}
                  className={`group relative flex flex-shrink-0 items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_8px_20px_-6px_rgba(6,182,212,0.5)] border-transparent scale-105 transform z-10"
                      : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-700/80 hover:text-slate-200 hover:border-slate-500 hover:shadow-lg"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-300 ${
                      isActive
                        ? "bg-white/20 text-white shadow-inner"
                        : "bg-slate-900/80 text-slate-500 group-hover:text-cyan-400"
                    }`}
                  >
                    <FontAwesomeIcon icon={faMicrochip} />
                  </div>
                  <span className="tracking-wide">{source.inputName}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 3. DATATABLE BİLEŞENİ */}
      <div className="animate-fade-in-up">
        <ChannelDataTable
          channels={filteredChannels}
          loading={loading}
          onRefresh={fetchData}
          onEdit={(item) => openModal(item)}
          onDelete={handleDelete}
          activeSourceName={activeSource?.inputName || ""}
        />
      </div>

      {/* 4. MODAL */}
      <ChannelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        activeSource={activeSource}
        itemToEdit={itemToEdit}
      />
    </div>
  );
};

export default ChannelList;
