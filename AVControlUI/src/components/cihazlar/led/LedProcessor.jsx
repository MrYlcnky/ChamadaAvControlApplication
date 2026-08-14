import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import ledProcessorService from "../../../services/ledProcessorService";
import LedProcessorModal from "./LedProcessorModal";
import LedProcessorDataTable from "./LedProcessorDataTable";

const initialFormData = {
  cihazAdi: "",
  ipAdresi: "",
  port: 80,
  macAdresi: "",
  cihazMarka: "", // YENİ
  seriNo: "", // YENİ
  kullaniciAdi: "", // YENİ
  sifre: "", // YENİ
  kullanicidaGosterilsinMi: true,
  aktifMi: true,
  viplexKontroluVarMi: false,
  cihazGorselUrl: "",
  gorselDosyasi: null,
};

const LedProcessor = forwardRef((props, ref) => {
  const [cihazlar, setCihazlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("ekle");
  const [selectedId, setSelectedId] = useState(null);

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    let iptalEdildi = false;

    const loadCihazlar = async () => {
      try {
        const data = await ledProcessorService.getAll();
        if (!iptalEdildi) setCihazlar(Array.isArray(data) ? data : []);
      } catch {
        if (!iptalEdildi) toast.error("LED işlemciler yüklenemedi.");
      } finally {
        if (!iptalEdildi) setLoading(false);
      }
    };

    loadCihazlar();
    return () => {
      iptalEdildi = true;
    };
  }, []);

  const fetchCihazlar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ledProcessorService.getAll();
      setCihazlar(Array.isArray(data) ? data : []);
    } catch {
      toast.error("LED işlemciler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  const openModal = useCallback((mode, item = null) => {
    setModalMode(mode);

    if (mode === "duzenle" && item) {
      setSelectedId(item.id);
      setFormData({
        cihazAdi: item.cihazAdi || "",
        ipAdresi: item.ipAdresi || "",
        port: item.port || 80,
        macAdresi: item.macAdresi || "",
        cihazMarka: item.cihazMarka || "", // YENİ
        seriNo: item.seriNo || "", // YENİ
        kullaniciAdi: item.kullaniciAdi || "", // YENİ
        sifre: item.sifre || "", // YENİ
        kullanicidaGosterilsinMi:
          item.kullanicidaGosterilsinMi !== undefined
            ? Boolean(item.kullanicidaGosterilsinMi)
            : true,
        aktifMi: Boolean(item.aktifMi),
        viplexKontroluVarMi: Boolean(item.viplexKontroluVarMi),
        cihazGorselUrl: item.cihazGorselUrl || "",
        gorselDosyasi: null,
      });
    } else {
      setSelectedId(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  }, []);

  useImperativeHandle(
    ref,
    () => ({ openCreateModal: () => openModal("ekle") }),
    [openModal],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, port: parseInt(formData.port, 10) };
    if (modalMode === "duzenle") payload.id = selectedId;

    try {
      setActionLoading(true);
      if (modalMode === "ekle") {
        await ledProcessorService.create(payload);
      } else {
        await ledProcessorService.update(payload);
      }
      toast.success("İşlem başarılı!");
      setIsModalOpen(false);
      await fetchCihazlar();
    } catch (err) {
      toast.error(err.response?.data?.mesaj || "Hata oluştu.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu LED işlemci sistemden silinecek. Bu işlem geri alınamaz.",
      icon: "warning",
      showCancelButton: true,
      background: "#0f172a",
      color: "#e5e7eb",
      confirmButtonText: "Evet, Sil",
      cancelButtonText: "İptal",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#334155",
      reverseButtons: true,
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
      await ledProcessorService.delete(id);
      toast.success("LED işlemci silindi.");
      await fetchCihazlar();
    } catch {
      toast.error("Silme işlemi başarısız.");
    }
  };

  return (
    <div className="space-y-5">
      <LedProcessorDataTable
        cihazlar={cihazlar}
        loading={loading}
        onRefresh={fetchCihazlar}
        onEdit={(item) => openModal("duzenle", item)}
        onDelete={handleDelete}
      />
      <LedProcessorModal
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        modalMode={modalMode}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        actionLoading={actionLoading}
      />
    </div>
  );
});

LedProcessor.displayName = "LedProcessor";
export default LedProcessor;
