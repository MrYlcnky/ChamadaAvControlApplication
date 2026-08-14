import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import matrixService from "../../../services/matrixService";
import MatrixModal from "./MatrixModal";
import MatrixDataTable from "./MatrixDataTable";
import MatrixPortModal from "./MatrixPortModal";

// 🔥 DÜZELTME 1: Başlangıç verilerini Matrix cihazına göre ayarladık
const initialFormData = {
  cihazAdi: "",
  ipAdresi: "",
  telnetPort: 23, // port yerine telnetPort oldu
  inputSayisi: 8, // YENİ
  outputSayisi: 8, // YENİ
  macAdresi: "",
  aktifMi: true,
  cihazGorselUrl: "",
  gorselDosyasi: null,
};

const Matrix = forwardRef((props, ref) => {
  const [cihazlar, setCihazlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("ekle");
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const [portModalOpen, setPortModalOpen] = useState(false);
  const [selectedPortDevice, setSelectedPortDevice] = useState(null);

  useEffect(() => {
    let iptalEdildi = false;

    const loadCihazlar = async () => {
      try {
        const data = await matrixService.getAll();
        if (!iptalEdildi) {
          setCihazlar(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!iptalEdildi) {
          toast.error("Matrix cihazları yüklenemedi.");
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
      const data = await matrixService.getAll();
      setCihazlar(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Matrix cihazları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  const openModal = useCallback((mode, item = null) => {
    setModalMode(mode);

    if (mode === "duzenle" && item) {
      setSelectedId(item.id);

      // 🔥 DÜZELTME 2: Düzenle butonuna basılınca tablodan gelen verileri forma basıyoruz
      setFormData({
        cihazAdi: item.cihazAdi || "",
        ipAdresi: item.ipAdresi || "",
        telnetPort: item.telnetPort || 23,
        inputSayisi: item.inputSayisi || 8,
        outputSayisi: item.outputSayisi || 8,
        macAdresi: item.macAdresi || "",
        aktifMi: Boolean(item.aktifMi),
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
    () => ({
      openCreateModal: () => openModal("ekle"),
    }),
    [openModal],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔥 DÜZELTME 3: Gönderirken verileri doğru Parse ediyoruz
    const payload = {
      ...formData,
      telnetPort: parseInt(formData.telnetPort, 10),
      inputSayisi: parseInt(formData.inputSayisi, 10),
      outputSayisi: parseInt(formData.outputSayisi, 10),
    };

    if (modalMode === "duzenle") {
      payload.id = selectedId;
    }

    try {
      setActionLoading(true);

      if (modalMode === "ekle") {
        await matrixService.create(payload);
      } else {
        await matrixService.update(payload);
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
      text: "Bu Matrix cihazı sistemden silinecek. Bu işlem geri alınamaz.",
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
      await matrixService.delete(id);
      toast.success("Matrix cihazı silindi.");
      await fetchCihazlar();
    } catch {
      toast.error("Silme işlemi başarısız.");
    }
  };

  const handleManagePorts = (device) => {
    setSelectedPortDevice(device);
    setPortModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-av-card-enter">
      <MatrixDataTable
        cihazlar={cihazlar}
        loading={loading}
        onRefresh={fetchCihazlar}
        onEdit={(item) => openModal("duzenle", item)}
        onDelete={handleDelete}
        onManagePorts={handleManagePorts}
      />

      <MatrixModal
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        modalMode={modalMode}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        actionLoading={actionLoading}
      />

      {portModalOpen && (
        <MatrixPortModal
          isOpen={portModalOpen}
          onClose={() => {
            setPortModalOpen(false);
            setSelectedPortDevice(null);
          }}
          device={selectedPortDevice}
        />
      )}
    </div>
  );
});

Matrix.displayName = "Matrix";

export default Matrix;
