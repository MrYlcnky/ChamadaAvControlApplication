import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPenToSquare,
  faTrash,
  faUserShield,
  faSpinner,
  faUser,
  faShieldHalved,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import kullaniciService from "../services/kullaniciService";
import KullaniciModal from "../components/kullaniciYönetimi/KullaniciModal";
import BolgeYetkiModal from "../components/kullaniciYönetimi/BolgeYetkiModal";
import Swal from "sweetalert2";

const KullaniciYonetimi = () => {
  const [kullanicilar, setKullanicilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // PIN gizle / göster
  const [visiblePins, setVisiblePins] = useState({});

  // Mevcut kullanıcı ekleme / düzenleme modalı
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("ekle");
  const [selectedId, setSelectedId] = useState(null);

  // Yeni: bölge yetkilendirme modalı
  const [selectedBolgeUser, setSelectedBolgeUser] = useState(null);
  const [updatedZoneCounts, setUpdatedZoneCounts] = useState({});

  const [formData, setFormData] = useState({
    ad: "",
    soyad: "",
    kullaniciAdi: "",
    sifre: "",
    pinKodu: "",
    rol: "2",
    aktifMi: true,
  });

  // İlk açılış: API yanıtı asenkron olarak geldiğinde state güncellenir.
  // Bileşen kapanmışsa eski isteğin sonucu ekrana uygulanmaz.
  useEffect(() => {
    let cancelled = false;

    kullaniciService
      .getAll()
      .then((data) => {
        if (cancelled) return;
        setKullanicilar(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Kullanıcılar yüklenemedi:", error);
        toast.error("Kullanıcılar yüklenirken bir hata oluştu.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Kullanıcı ekleme, düzenleme ve silme sonrasında listeyi yeniler.
  const fetchKullanicilar = async () => {
    try {
      const data = await kullaniciService.getAll();
      setKullanicilar(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Kullanıcılar yüklenemedi:", error);
      toast.error("Kullanıcılar yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (rolValue) =>
    Number(rolValue) === 1 ? "Sistem Yöneticisi" : "Normal Kullanıcı";

  const togglePinVisibility = (id) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openModal = (mode, user = null) => {
    setModalMode(mode);

    if (mode === "duzenle" && user) {
      setSelectedId(user.id);
      setFormData({
        ad: user.ad || "",
        soyad: user.soyad || "",
        kullaniciAdi: user.kullaniciAdi || "",
        sifre: "",
        pinKodu: user.pinKodu || "",
        rol: user.rol ? user.rol.toString() : "2",
        aktifMi: user.aktifMi,
      });
    } else {
      setSelectedId(null);
      setFormData({
        ad: "",
        soyad: "",
        kullaniciAdi: "",
        sifre: "",
        pinKodu: "",
        rol: "2",
        aktifMi: true,
      });
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    // Bölge atamaları yalnızca BölgeYetkiModal üzerinden yapılır.
    const payload = {
      ad: formData.ad,
      soyad: formData.soyad,
      kullaniciAdi: formData.kullaniciAdi,
      sifre: formData.sifre,
      rol: parseInt(formData.rol, 10),
      pinKodu: formData.pinKodu ? parseInt(formData.pinKodu, 10) : null,
      aktifMi: formData.aktifMi,
    };

    if (modalMode === "duzenle") payload.id = selectedId;

    try {
      if (modalMode === "ekle") {
        await kullaniciService.create(payload);
        toast.success("Kullanıcı başarıyla eklendi!");
      } else {
        await kullaniciService.update(payload);
        toast.success("Kullanıcı başarıyla güncellendi!");
      }

      await fetchKullanicilar();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.mesaj || "İşlem başarısız oldu.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu kullanıcıyı sildiğinizde geri alamazsınız!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Evet, Sil!",
      cancelButtonText: "İptal",
      background: document.documentElement.classList.contains("dark")
        ? "#0f172a"
        : "#ffffff",
      color: document.documentElement.classList.contains("dark")
        ? "#e2e8f0"
        : "#1e293b",
    });

    if (!result.isConfirmed) return;

    try {
      await kullaniciService.delete(id);
      toast.success("Kullanıcı başarıyla silindi.");
      await fetchKullanicilar();
    } catch (error) {
      toast.error(
        error.response?.data?.mesaj || "Silme işlemi başarısız oldu.",
      );
    }
  };

  const openBolgeYetkileri = (user) => {
    setSelectedBolgeUser(user);
  };

  return (
    <div className="animate-av-card-enter mt-6 pb-10">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-2xl font-bold text-transparent dark:from-blue-100 dark:to-cyan-300">
            <FontAwesomeIcon
              icon={faUserShield}
              className="text-blue-500 dark:text-cyan-400"
            />
            Kullanıcı Yönetimi
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kullanıcıları oluşturun; erişebilecekleri bölgeleri ayrı yetki
            penceresinden yönetin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal("ekle")}
          className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:from-blue-500 hover:to-cyan-500"
        >
          <FontAwesomeIcon
            icon={faPlus}
            className="transition-transform group-hover:rotate-90"
          />
          <span>Yeni Kullanıcı</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white/80 shadow-xl backdrop-blur-2xl dark:border-blue-400/20 dark:bg-slate-900/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs tracking-widest text-gray-500 uppercase dark:border-blue-400/20 dark:bg-slate-800/50 dark:text-gray-400">
                <th className="px-6 py-4 font-semibold">Kullanıcı Adı</th>
                <th className="px-6 py-4 font-semibold">Ad Soyad</th>
                <th className="px-6 py-4 text-center font-semibold">Rol</th>
                <th className="px-6 py-4 text-center font-semibold">
                  Kiosk Pin
                </th>
                <th className="px-6 py-4 text-center font-semibold">Durum</th>
                <th className="px-6 py-4 text-right font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      className="text-2xl text-blue-500"
                    />
                  </td>
                </tr>
              ) : kullanicilar.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
                  >
                    Henüz kullanıcı bulunmuyor.
                  </td>
                </tr>
              ) : (
                kullanicilar.map((user) => {
                  const isAdminUser = Number(user.rol) === 1;
                  const count = updatedZoneCounts[user.id];
                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-gray-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-slate-800 dark:text-cyan-400">
                            <FontAwesomeIcon icon={faUser} />
                          </div>
                          <span>{user.kullaniciAdi}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {user.ad} {user.soyad}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${isAdminUser ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"}`}
                        >
                          {getRoleName(user.rol)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono">
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(user.id)}
                          className="cursor-pointer transition-colors hover:text-cyan-400"
                          title="PIN'i görmek için tıkla"
                          aria-label={`${user.kullaniciAdi} PIN göster/gizle`}
                        >
                          {user.pinKodu
                            ? visiblePins[user.id]
                              ? user.pinKodu
                              : "****"
                            : "-"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.aktifMi ? (
                          <span className="font-medium text-emerald-400">
                            Aktif
                          </span>
                        ) : (
                          <span className="font-medium text-red-400">
                            Pasif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdminUser && (
                            <span
                              title="Admin zaten tüm bölgeleri görebilir. Bölge ataması isteğe bağlıdır."
                              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/20 bg-purple-500/10 px-2.5 py-2 text-[11px] font-bold text-purple-300"
                            >
                              <FontAwesomeIcon icon={faLock} />
                              Tüm Bölgeler
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => openBolgeYetkileri(user)}
                            title={`${user.kullaniciAdi} için bölge yetkilerini düzenle`}
                            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-[11px] font-bold whitespace-nowrap text-cyan-300 transition hover:border-cyan-400/60 hover:bg-cyan-500/20"
                          >
                            <FontAwesomeIcon icon={faShieldHalved} />
                            {Number.isInteger(count)
                              ? `${count} Bölge`
                              : "Bölge Yetkileri"}
                          </button>

                          <button
                            type="button"
                            onClick={() => openModal("duzenle", user)}
                            title="Kullanıcıyı düzenle"
                            aria-label={`${user.kullaniciAdi} düzenle`}
                            className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 dark:bg-slate-800 dark:text-cyan-400 dark:hover:bg-slate-700"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(user.id)}
                            title="Kullanıcıyı sil"
                            aria-label={`${user.kullaniciAdi} sil`}
                            className="h-9 w-9 rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-500/20"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <KullaniciModal
        isOpen={isModalOpen}
        closeModal={closeModal}
        modalMode={modalMode}
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        actionLoading={actionLoading}
      />

      {selectedBolgeUser && (
        <BolgeYetkiModal
          key={selectedBolgeUser.id}
          kullanici={selectedBolgeUser}
          onClose={() => setSelectedBolgeUser(null)}
          onSaved={(kullaniciId, count) =>
            setUpdatedZoneCounts((prev) => ({
              ...prev,
              [kullaniciId]: count,
            }))
          }
        />
      )}
    </div>
  );
};

export default KullaniciYonetimi;
