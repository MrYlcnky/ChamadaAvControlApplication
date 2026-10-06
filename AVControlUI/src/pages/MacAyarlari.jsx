import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFutbol,
  faShieldHalved,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

import favoriTakimService from "../services/favoriTakimService";
import favoriLigService from "../services/favoriLigService";
import macTakvimService from "../services/macTakvimService";

import MacDataTable from "../components/macAyarlari/MacDataTable";
import MacModal from "../components/macAyarlari/MacModal";

// ================================================================
// API'DEN FAVORİ YÖNETİMİ VERİLERİNİ GETİR
// Bu fonksiyon component dışında olduğu için state değiştirmez.
// ================================================================

const getFavoriYonetimiVerileri = async () => {
  const [takimData, ligData, macData] = await Promise.all([
    favoriTakimService.getAll(),
    favoriLigService.getAll(),
    macTakvimService.getTumMaclar(),
  ]);

  return {
    takimlar: Array.isArray(takimData) ? takimData : [],
    ligler: Array.isArray(ligData) ? ligData : [],
    maclar: Array.isArray(macData) ? macData : [],
  };
};

const MacAyarlari = () => {
  const [takimlar, setTakimlar] = useState([]);
  const [ligler, setLigler] = useState([]);
  const [tumMaclar, setTumMaclar] = useState([]);

  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("takim");
  const [itemToEdit, setItemToEdit] = useState(null);

  const [formData, setFormData] = useState({
    ad: "",
    aktifMi: true,
    ligler: [],
  });

  const [actionLoading, setActionLoading] = useState(false);

  // ================================================================
  // İLK YÜKLEME
  // ================================================================

  useEffect(() => {
    let cancelled = false;

    getFavoriYonetimiVerileri()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setTakimlar(data.takimlar);
        setLigler(data.ligler);
        setTumMaclar(data.maclar);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error("Favori yönetimi verileri yüklenemedi:", error);

        toast.error(
          error.response?.data?.mesaj || "Veriler yüklenirken hata oluştu.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ================================================================
  // SONRADAN VERİLERİ YENİLE
  // Ekleme / güncelleme / silme sonrası kullanılır.
  // ================================================================

  const refreshData = async () => {
    try {
      const data = await getFavoriYonetimiVerileri();

      setTakimlar(data.takimlar);
      setLigler(data.ligler);
      setTumMaclar(data.maclar);
    } catch (error) {
      console.error("Favori yönetimi verileri yenilenemedi:", error);

      toast.error(
        error.response?.data?.mesaj || "Veriler yenilenirken hata oluştu.",
      );
    }
  };

  // ================================================================
  // TAKIM İÇİN SEÇİLEBİLİR LİGLER
  // ================================================================

  const ligSecenekleri = useMemo(() => {
    const tumLigAdlari = [];

    // MacTakvim tablosunda bulunan gerçek ligler
    tumMaclar.forEach((mac) => {
      const ligAdi = mac?.ligAdi?.trim();

      if (ligAdi) {
        tumLigAdlari.push(ligAdi);
      }
    });

    // Daha önce takımlara eklenen ligleri de koru
    takimlar.forEach((takim) => {
      if (!Array.isArray(takim?.ligler)) {
        return;
      }

      takim.ligler.forEach((ligAdi) => {
        const temizLigAdi = ligAdi?.trim();

        if (temizLigAdi) {
          tumLigAdlari.push(temizLigAdi);
        }
      });
    });

    // Aynı ligi büyük/küçük harf farkıyla tekrar gösterme
    const benzersizLigler = new Map();

    tumLigAdlari.forEach((ligAdi) => {
      const key = ligAdi.toLocaleLowerCase("tr-TR");

      if (!benzersizLigler.has(key)) {
        benzersizLigler.set(key, ligAdi);
      }
    });

    return Array.from(benzersizLigler.values()).sort((a, b) =>
      a.localeCompare(b, "tr-TR"),
    );
  }, [tumMaclar, takimlar]);

  // ================================================================
  // MODAL AÇ
  // ================================================================

  const openModal = (type, item = null) => {
    setModalType(type);
    setItemToEdit(item);

    if (item) {
      setFormData({
        ad: type === "takim" ? item.takimAdi || "" : item.ligAdi || "",

        aktifMi: Boolean(item.aktifMi),

        ligler:
          type === "takim" && Array.isArray(item.ligler)
            ? [...item.ligler]
            : [],
      });
    } else {
      setFormData({
        ad: "",
        aktifMi: true,
        ligler: [],
      });
    }

    setIsModalOpen(true);
  };

  // ================================================================
  // MODAL KAPAT
  // ================================================================

  const closeModal = () => {
    if (actionLoading) {
      return;
    }

    setIsModalOpen(false);
    setItemToEdit(null);

    setFormData({
      ad: "",
      aktifMi: true,
      ligler: [],
    });
  };

  // ================================================================
  // EKLE / GÜNCELLE
  // ================================================================

  const handleModalSubmit = async (event) => {
    event.preventDefault();

    const temizAd = formData.ad.trim();

    if (!temizAd) {
      toast.warning("Lütfen bir ad giriniz.");
      return;
    }

    const isTakim = modalType === "takim";

    // Takım ekleniyorsa en az 1 lig zorunlu
    if (
      isTakim &&
      (!Array.isArray(formData.ligler) || formData.ligler.length === 0)
    ) {
      toast.warning("Favori takım için en az bir lig seçmelisiniz.");

      return;
    }

    const payload = {
      aktifMi: Boolean(formData.aktifMi),
    };

    // --------------------------------------------------------------
    // TAKIM PAYLOAD
    // --------------------------------------------------------------

    if (isTakim) {
      payload.takimAdi = temizAd;

      const benzersizLigler = new Map();

      formData.ligler.forEach((ligAdi) => {
        const temizLigAdi = ligAdi?.trim();

        if (!temizLigAdi) {
          return;
        }

        const key = temizLigAdi.toLocaleLowerCase("tr-TR");

        if (!benzersizLigler.has(key)) {
          benzersizLigler.set(key, temizLigAdi);
        }
      });

      payload.ligler = Array.from(benzersizLigler.values());
    }

    // --------------------------------------------------------------
    // LİG PAYLOAD
    // --------------------------------------------------------------
    else {
      payload.ligAdi = temizAd;
    }

    // Güncelleme ise ID gönder
    if (itemToEdit) {
      payload.id = itemToEdit.id;
    }

    // --------------------------------------------------------------
    // API İŞLEMİ
    // --------------------------------------------------------------

    try {
      setActionLoading(true);

      if (itemToEdit) {
        if (isTakim) {
          await favoriTakimService.update(payload);
        } else {
          await favoriLigService.update(payload);
        }

        toast.success("Güncelleme başarılı.");
      } else {
        if (isTakim) {
          await favoriTakimService.create(payload);
        } else {
          await favoriLigService.create(payload);
        }

        toast.success("Ekleme başarılı.");
      }

      setIsModalOpen(false);
      setItemToEdit(null);

      setFormData({
        ad: "",
        aktifMi: true,
        ligler: [],
      });

      await refreshData();
    } catch (error) {
      console.error("Favori kayıt işlemi başarısız:", error);

      toast.error(error.response?.data?.mesaj || "İşlem başarısız oldu.");
    } finally {
      setActionLoading(false);
    }
  };

  // ================================================================
  // SİL
  // ================================================================

  const handleDelete = async (type, id) => {
    const isTakim = type === "takim";

    const result = await Swal.fire({
      title: "Emin misiniz?",

      text: `Bu ${isTakim ? "takım" : "lig"} silinecek ve geri alınamaz.`,

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

    if (!result.isConfirmed) {
      return;
    }

    try {
      if (isTakim) {
        await favoriTakimService.delete(id);
      } else {
        await favoriLigService.delete(id);
      }

      toast.success(`${isTakim ? "Takım" : "Lig"} başarıyla silindi.`);

      await refreshData();
    } catch (error) {
      console.error("Silme işlemi başarısız:", error);

      toast.error(error.response?.data?.mesaj || "Silme işlemi başarısız.");
    }
  };

  // ================================================================
  // JSX
  // ================================================================

  return (
    <div className="space-y-8 pt-2 animate-av-card-enter">
      {/* HEADER */}
      <div className="flex flex-col items-start justify-between gap-5 px-2 sm:flex-row sm:items-end">
        <div className="flex items-center gap-5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 text-cyan-400 shadow-inner">
            <div className="absolute inset-0 bg-cyan-400/10 blur-md" />

            <FontAwesomeIcon
              icon={faFutbol}
              className="relative z-10 text-2xl drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
            />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
              Favori Yönetimi
            </h1>

            <p className="mt-1.5 text-sm font-medium text-slate-400">
              Sistemde takip edilecek favori takım ve ligleri buradan
              belirleyin.
            </p>
          </div>
        </div>
      </div>

      {/* TABLOLAR */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <MacDataTable
          title="Favori Takımlar"
          icon={faShieldHalved}
          type="takim"
          data={takimlar}
          loading={loading}
          onAdd={openModal}
          onEdit={openModal}
          onDelete={handleDelete}
        />

        <MacDataTable
          title="Favori Ligler"
          icon={faTrophy}
          type="lig"
          data={ligler}
          loading={loading}
          onAdd={openModal}
          onEdit={openModal}
          onDelete={handleDelete}
        />
      </div>

      {/* MODAL */}
      <MacModal
        key={`${modalType}-${itemToEdit?.id ?? "new"}-${isModalOpen}`}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        formData={formData}
        setFormData={setFormData}
        type={modalType}
        itemToEdit={itemToEdit}
        actionLoading={actionLoading}
        ligSecenekleri={ligSecenekleri}
      />
    </div>
  );
};

export default MacAyarlari;
