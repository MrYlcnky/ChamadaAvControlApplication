import React, { useState, useEffect } from "react";
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

// Alt Bileşenler
import MacDataTable from "../components/macAyarlari/MacDataTable";
import MacModal from "../components/macAyarlari/MacModal";

const MacAyarlari = () => {
  const [takimlar, setTakimlar] = useState([]);
  const [ligler, setLigler] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("takim"); // 'takim' veya 'lig'
  const [itemToEdit, setItemToEdit] = useState(null);
  const [formData, setFormData] = useState({ ad: "", aktifMi: true });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [takimData, ligData] = await Promise.all([
        favoriTakimService.getAll(),
        favoriLigService.getAll(),
      ]);
      setTakimlar(Array.isArray(takimData) ? takimData : []);
      setLigler(Array.isArray(ligData) ? ligData : []);
    } catch (error) {
      toast.error("Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // --- SİLME İŞLEMİ ---
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

    if (result.isConfirmed) {
      try {
        if (isTakim) await favoriTakimService.delete(id);
        else await favoriLigService.delete(id);

        toast.success(`${isTakim ? "Takım" : "Lig"} başarıyla silindi.`);
        fetchData();
      } catch (err) {
        toast.error("Silme işlemi başarısız.");
      }
    }
  };

  // --- MODAL AÇMA/KAPAMA YÖNETİMİ ---
  const openModal = (type, item = null) => {
    setModalType(type);
    setItemToEdit(item);
    if (item) {
      setFormData({
        ad: type === "takim" ? item.takimAdi : item.ligAdi,
        aktifMi: Boolean(item.aktifMi),
      });
    } else {
      setFormData({ ad: "", aktifMi: true });
    }
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ad.trim()) {
      toast.warning("Lütfen bir ad giriniz.");
      return;
    }

    const isTakim = modalType === "takim";
    const payload = { aktifMi: formData.aktifMi };

    if (isTakim) payload.takimAdi = formData.ad;
    else payload.ligAdi = formData.ad;

    if (itemToEdit) payload.id = itemToEdit.id;

    try {
      setActionLoading(true);
      if (itemToEdit) {
        if (isTakim) await favoriTakimService.update(payload);
        else await favoriLigService.update(payload);
        toast.success("Güncelleme başarılı.");
      } else {
        if (isTakim) await favoriTakimService.create(payload);
        else await favoriLigService.create(payload);
        toast.success("Ekleme başarılı.");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("İşlem başarısız oldu.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-av-card-enter pt-2">
      {/* 1. ÜST BİLGİ (HEADER) */}
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end px-2">
        <div className="flex items-center gap-5">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/50 border border-slate-700/50 text-cyan-400 shadow-inner overflow-hidden">
            <div className="absolute inset-0 bg-cyan-400/10 blur-md"></div>
            <FontAwesomeIcon
              icon={faFutbol}
              className="relative z-10 text-2xl drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
            />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide text-white">
              Favori Yönetimi
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-400">
              Sistemde takip edilecek favori takım ve ligleri buradan
              belirleyin.
            </p>
          </div>
        </div>
      </div>

      {/* 2. TABLOLAR (YAN YANA / ALT ALTA) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Favori Takımlar Tablosu */}
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

        {/* Favori Ligler Tablosu */}
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

      {/* 3. MODAL (ORTAK KULLANIM) */}
      <MacModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        formData={formData}
        setFormData={setFormData}
        type={modalType}
        itemToEdit={itemToEdit}
        actionLoading={actionLoading}
      />
    </div>
  );
};

export default MacAyarlari;
