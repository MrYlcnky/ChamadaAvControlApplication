import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import irTransmitterService from "../../../services/irTransmitterService";
import IrTransmitterModal from "./IrTransmitterModal";
import IrTransmitterDataTable from "./IrTransmitterDataTable";

const initialFormData = {
  cihazAdi: "",
  ipAdresi: "",
  macAdresi: "",
  aktifMi: true,
  cihazGorselUrl: "", // YENİ
  gorselDosyasi: null, // YENİ
};

const IrTransmitter = forwardRef((props, ref) => {
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
        const data = await irTransmitterService.getAll();
        if (!iptalEdildi) {
          setCihazlar(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!iptalEdildi) {
          toast.error("IR Vericiler yüklenemedi.");
        }
      } finally {
        if (!iptalEdildi) {
          setLoading(false);
        }
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
      const data = await irTransmitterService.getAll();
      setCihazlar(Array.isArray(data) ? data : []);
    } catch {
      toast.error("IR Vericiler yüklenemedi.");
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
        macAdresi: item.macAdresi || "",
        aktifMi: Boolean(item.aktifMi),
        cihazGorselUrl: item.cihazGorselUrl || "", // YENİ
        gorselDosyasi: null, // YENİ
      });
    } else {
      setSelectedId(null);
      setFormData(initialFormData);
    }

    setIsModalOpen(true);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      openCreateModal: () => openModal("ekle"),
    }),
    [openModal],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { ...formData };

    if (modalMode === "duzenle") {
      payload.id = selectedId;
    }

    try {
      setActionLoading(true);

      if (modalMode === "ekle") {
        await irTransmitterService.create(payload);
      } else {
        await irTransmitterService.update(payload);
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
      text: "Bu IR verici sistemden silinecek. Bu işlem geri alınamaz.",
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
      await irTransmitterService.delete(id);
      toast.success("IR verici silindi.");
      await fetchCihazlar();
    } catch {
      toast.error("Silme işlemi başarısız.");
    }
  };

  return (
    <div className="space-y-5 animate-av-card-enter">
      <IrTransmitterDataTable
        cihazlar={cihazlar}
        loading={loading}
        onRefresh={fetchCihazlar}
        onEdit={(item) => openModal("duzenle", item)}
        onDelete={handleDelete}
      />

      <IrTransmitterModal
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

IrTransmitter.displayName = "IrTransmitter";

export default IrTransmitter;
