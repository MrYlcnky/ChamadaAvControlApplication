import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPenToSquare,
  faTrash,
  faMobileScreen,
  faKeyboard,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

import remoteControlService from "../services/remoteControlService";
import remoteButtonService from "../services/remoteButtonService";
import irTransmitterService from "../services/irTransmitterService";
import orchestrationService from "../services/orchestrationService";

import RemoteControlModal from "../components/kumandalar/RemoteControlModal";
import RemoteButtonModal from "../components/kumandalar/RemoteButtonModal";

const Kumandalar = () => {
  const [activeTab, setActiveTab] = useState("profiller");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [kumandalar, setKumandalar] = useState([]);
  const [tuslar, setTuslar] = useState([]);
  const [piList, setPiList] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("ekle");
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({});

  const isProfileTab = activeTab === "profiller";

  useEffect(() => {
    let iptalEdildi = false;

    const loadData = async () => {
      try {
        if (activeTab === "profiller") {
          const data = await remoteControlService.getAll();

          if (!iptalEdildi) {
            setKumandalar(Array.isArray(data) ? data : []);
          }

          return;
        }

        const [kData, tData, pData] = await Promise.all([
          remoteControlService.getAll(),
          remoteButtonService.getAll(),
          irTransmitterService.getAll(),
        ]);

        if (iptalEdildi) return;

        const safeKumandalar = Array.isArray(kData) ? kData : [];
        const safeTuslar = Array.isArray(tData) ? tData : [];
        const safePiList = Array.isArray(pData) ? pData : [];

        const enrichedTuslar = safeTuslar.map((tus) => ({
          ...tus,
          kumandaMarkaModel:
            tus.kumandaMarkaModel ||
            safeKumandalar.find((kumanda) => kumanda.id === tus.remoteControlId)
              ?.kumandaMarkaModel ||
            "Bilinmiyor",
        }));

        setKumandalar(safeKumandalar);
        setTuslar(enrichedTuslar);
        setPiList(safePiList);
      } catch {
        if (!iptalEdildi) {
          toast.error("Veriler yüklenirken hata oluştu.");
        }
      } finally {
        if (!iptalEdildi) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      iptalEdildi = true;
    };
  }, [activeTab]);

  const refreshData = async () => {
    try {
      setLoading(true);

      if (activeTab === "profiller") {
        const data = await remoteControlService.getAll();
        setKumandalar(Array.isArray(data) ? data : []);
        return;
      }

      const [kData, tData, pData] = await Promise.all([
        remoteControlService.getAll(),
        remoteButtonService.getAll(),
        irTransmitterService.getAll(),
      ]);

      const safeKumandalar = Array.isArray(kData) ? kData : [];
      const safeTuslar = Array.isArray(tData) ? tData : [];
      const safePiList = Array.isArray(pData) ? pData : [];

      const enrichedTuslar = safeTuslar.map((tus) => ({
        ...tus,
        kumandaMarkaModel:
          tus.kumandaMarkaModel ||
          safeKumandalar.find((kumanda) => kumanda.id === tus.remoteControlId)
            ?.kumandaMarkaModel ||
          "Bilinmiyor",
      }));

      setKumandalar(safeKumandalar);
      setTuslar(enrichedTuslar);
      setPiList(safePiList);
    } catch {
      toast.error("Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;

    setLoading(true);
    setActiveTab(tab);
    setIsModalOpen(false);
    setSelectedId(null);
    setFormData({});
  };

  const openModal = (mode, item = null) => {
    setModalMode(mode);
    setSelectedId(item?.id ?? null);

    if (activeTab === "profiller") {
      setFormData(
        mode === "duzenle" && item
          ? { ...item }
          : {
              cihazTipi: "",
              kumandaMarkaModel: "",
              protokolTipi: "",
              aktifMi: true,
            },
      );
    } else {
      setFormData(
        mode === "duzenle" && item
          ? { ...item }
          : {
              remoteControlId: "",
              tusKodu: "",
              rawDataJson: "",
              aktifMi: true,
            },
      );
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (actionLoading) return;

    setIsModalOpen(false);
    setSelectedId(null);
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setActionLoading(true);

      if (activeTab === "profiller") {
        const payload = { ...formData };

        if (modalMode === "duzenle") {
          payload.id = selectedId;
          await remoteControlService.update(payload);
        } else {
          await remoteControlService.create(payload);
        }
      } else {
        const payload = {
          ...formData,
          remoteControlId: parseInt(formData.remoteControlId, 10),
        };

        if (modalMode === "duzenle") {
          payload.id = selectedId;
          await remoteButtonService.update(payload);
        } else {
          await remoteButtonService.create(payload);
        }
      }

      toast.success("İşlem başarılı!");
      setIsModalOpen(false);
      setSelectedId(null);
      setFormData({});

      await refreshData();
    } catch (err) {
      toast.error(err.response?.data?.mesaj || "Hata oluştu.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: isProfileTab
        ? "Bu kumanda profili silinecek."
        : "Bu tuş sinyali silinecek.",
      icon: "warning",
      showCancelButton: true,

      background: "#0f172a",
      color: "#e5e7eb",

      confirmButtonText: "Evet, Sil",
      cancelButtonText: "İptal",

      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#334155",

      reverseButtons: true,
      focusCancel: true,

      customClass: {
        popup: "rounded-3xl border border-slate-700 shadow-2xl",
        title: "text-white",
        htmlContainer: "text-slate-400",
        confirmButton: "rounded-xl px-5 py-2 font-bold",
        cancelButton: "rounded-xl px-5 py-2 font-bold",
      },
    });

    if (!result.isConfirmed) return;

    try {
      if (activeTab === "profiller") {
        await remoteControlService.delete(id);
      } else {
        await remoteButtonService.delete(id);
      }

      toast.success("Başarıyla silindi.");
      await refreshData();
    } catch {
      toast.error("Silme işlemi başarısız.");
    }
  };

  const handleCaptureSignal = async (payload) => {
    return await orchestrationService.learnSignal(payload);
  };

  const currentData = isProfileTab ? kumandalar : tuslar;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">
        Kumanda & Sinyal Yönetimi
      </h1>

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-fit gap-2 rounded-xl bg-slate-900/50 p-1">
          <button
            type="button"
            onClick={() => handleTabChange("profiller")}
            className={`rounded-lg px-6 py-2 font-medium transition-all ${
              activeTab === "profiller"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <FontAwesomeIcon icon={faMobileScreen} className="mr-2" />
            Kumanda Profilleri
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("tuslar")}
            className={`rounded-lg px-6 py-2 font-medium transition-all ${
              activeTab === "tuslar"
                ? "bg-cyan-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <FontAwesomeIcon icon={faKeyboard} className="mr-2" />
            Tuşlar & Sinyaller
          </button>
        </div>

        <button
          type="button"
          onClick={() => openModal("ekle")}
          className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:from-blue-500 hover:to-cyan-500"
        >
          <FontAwesomeIcon icon={faPlus} />

          <span>
            {activeTab === "profiller" ? "Yeni Kumanda" : "Yeni Tuş Sinyali"}
          </span>
        </button>
      </div>

      <div className="rounded-3xl border border-blue-400/10 bg-slate-900/80 shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase tracking-widest text-slate-400">
              {isProfileTab ? (
                <tr>
                  <th className="px-6 py-4 font-semibold">Marka / Model</th>
                  <th className="px-6 py-4 font-semibold">Cihaz Tipi</th>
                  <th className="px-6 py-4 font-semibold">Protokol</th>
                  <th className="px-6 py-4 text-center font-semibold">Durum</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    İşlemler
                  </th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-4 font-semibold">Bağlı Kumanda</th>
                  <th className="px-6 py-4 font-semibold">Tuş Kodu</th>
                  <th className="px-6 py-4 font-semibold">Raw Sinyal</th>
                  <th className="px-6 py-4 text-center font-semibold">Durum</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    İşlemler
                  </th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-14 text-center">
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      className="text-2xl text-cyan-400"
                    />

                    <p className="mt-3 text-sm text-slate-400">
                      Veriler yükleniyor...
                    </p>
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-14 text-center">
                    <p className="font-bold text-slate-200">Kayıt bulunamadı</p>

                    <p className="mt-1 text-sm text-slate-500">
                      Yeni kayıt ekleyerek başlayabilirsiniz.
                    </p>
                  </td>
                </tr>
              ) : (
                currentData.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-800/40"
                  >
                    {isProfileTab ? (
                      <>
                        <td className="px-6 py-4 font-bold text-white">
                          {item.kumandaMarkaModel}
                        </td>

                        <td className="px-6 py-4">{item.cihazTipi}</td>

                        <td className="px-6 py-4 font-mono text-cyan-300">
                          {item.protokolTipi || "-"}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-bold text-cyan-300">
                          {item.kumandaMarkaModel}
                        </td>

                        <td className="px-6 py-4 font-bold text-white">
                          {item.tusKodu}
                        </td>

                        <td className="max-w-[260px] truncate px-6 py-4 font-mono text-xs text-slate-400">
                          {item.rawDataJson || "-"}
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.aktifMi
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {item.aktifMi ? "Aktif" : "Pasif"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openModal("duzenle", item)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-cyan-400 transition-colors hover:bg-cyan-500 hover:text-white"
                          title="Düzenle"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-red-400 transition-colors hover:bg-red-500 hover:text-white"
                          title="Sil"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeTab === "profiller" ? (
        <RemoteControlModal
          isOpen={isModalOpen}
          closeModal={closeModal}
          modalMode={modalMode}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          actionLoading={actionLoading}
        />
      ) : (
        <RemoteButtonModal
          isOpen={isModalOpen}
          closeModal={closeModal}
          modalMode={modalMode}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          actionLoading={actionLoading}
          kumandalarList={kumandalar}
          piList={piList}
          captureSignal={handleCaptureSignal}
        />
      )}
    </div>
  );
};

export default Kumandalar;
