import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPenToSquare,
  faTrash,
  faUserShield,
  faSpinner,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import kullaniciService from "../services/kullaniciService";
import KullaniciModal from "../components/kullaniciYönetimi/KullaniciModal";
import Swal from "sweetalert2";

const KullaniciYonetimi = () => {
  const [kullanicilar, setKullanicilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // PIN'leri gizli/görünür tutmak için state
  const [visiblePins, setVisiblePins] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("ekle");
  const [selectedId, setSelectedId] = useState(null);

  const [formData, setFormData] = useState({
    ad: "",
    soyad: "",
    kullaniciAdi: "",
    sifre: "",
    pinKodu: "",
    rol: "2", // Backend Enum değerine göre (2: Kullanici)
    aktifMi: true,
  });

  useEffect(() => {
    fetchKullanicilar();
  }, []);

  const fetchKullanicilar = async () => {
    try {
      const data = await kullaniciService.getAll();
      setKullanicilar(data);
    } catch (error) {
      toast.error("Kullanıcılar yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Rolleri okunabilir metne çeviren yardımcı fonksiyon
  const getRoleName = (rolValue) => {
    // 1: Admin, 2: Kullanici
    return rolValue == 1 ? "Sistem Yöneticisi" : "Normal Kullanıcı";
  };

  // PIN görünürlüğünü toggle eden fonksiyon
  const togglePinVisibility = (id) => {
    setVisiblePins((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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

    const payload = {
      ...formData,
      rol: parseInt(formData.rol, 10),
      pinKodu: formData.pinKodu ? parseInt(formData.pinKodu, 10) : null,
    };

    if (modalMode === "duzenle") {
      payload.id = selectedId;
    }

    try {
      if (modalMode === "ekle") {
        await kullaniciService.create(payload);
        toast.success("Kullanıcı başarıyla eklendi!");
      } else {
        await kullaniciService.update(payload);
        toast.success("Kullanıcı başarıyla güncellendi!");
      }
      fetchKullanicilar();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.mesaj || "İşlem başarısız oldu.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // SweetAlert2 ile onay penceresi
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu kullanıcıyı sildiğinizde geri alamazsınız!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6", // Mavi (Tailwind blue-500)
      cancelButtonColor: "#ef4444", // Kırmızı (Tailwind red-500)
      confirmButtonText: "Evet, Sil!",
      cancelButtonText: "İptal",
      background: document.documentElement.classList.contains("dark")
        ? "#0f172a"
        : "#ffffff",
      color: document.documentElement.classList.contains("dark")
        ? "#e2e8f0"
        : "#1e293b",
    });

    if (result.isConfirmed) {
      try {
        await kullaniciService.delete(id);
        toast.success("Kullanıcı başarıyla silindi.");
        fetchKullanicilar();
      } catch (error) {
        toast.error("Silme işlemi başarısız oldu.");
      }
    }
  };

  return (
    <div className="animate-av-card-enter mt-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 dark:from-blue-100 dark:to-cyan-300 flex items-center gap-3">
            <FontAwesomeIcon
              icon={faUserShield}
              className="text-blue-500 dark:text-cyan-400"
            />
            Kullanıcı Yönetimi
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sistemdeki tüm yöneticileri ve personelleri buradan yönetin.
          </p>
        </div>

        <button
          onClick={() => openModal("ekle")}
          className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
        >
          <FontAwesomeIcon
            icon={faPlus}
            className="transition-transform group-hover:rotate-90"
          />
          <span>Yeni Kullanıcı</span>
        </button>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-gray-200/80 dark:border-blue-400/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest border-b border-gray-200 dark:border-blue-400/20">
                <th className="px-6 py-4 font-semibold">Kullanıcı Adı</th>
                <th className="px-6 py-4 font-semibold">Ad Soyad</th>
                <th className="px-6 py-4 font-semibold text-center">Rol</th>
                <th className="px-6 py-4 font-semibold text-center">
                  Kiosk Pin
                </th>
                <th className="px-6 py-4 font-semibold text-center">Durum</th>
                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      className="text-2xl text-blue-500"
                    />
                  </td>
                </tr>
              ) : (
                kullanicilar.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-cyan-400">
                        <FontAwesomeIcon icon={faUser} />
                      </div>
                      {user.kullaniciAdi}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {user.ad} {user.soyad}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full ${user.rol == 1 ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"}`}
                      >
                        {getRoleName(user.rol)}
                      </span>
                    </td>
                    {/* PIN GİZLE/GÖSTER */}
                    <td
                      onClick={() => togglePinVisibility(user.id)}
                      className="px-6 py-4 text-center font-mono cursor-pointer hover:text-cyan-400 transition-colors"
                      title="PIN'i görmek için tıkla"
                    >
                      {user.pinKodu
                        ? visiblePins[user.id]
                          ? user.pinKodu
                          : "****"
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.aktifMi ? (
                        <span className="text-emerald-400">Aktif</span>
                      ) : (
                        <span className="text-red-400">Pasif</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal("duzenle", user)}
                          className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-cyan-400 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 dark:bg-slate-800 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
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

      <KullaniciModal
        isOpen={isModalOpen}
        closeModal={closeModal}
        modalMode={modalMode}
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        actionLoading={actionLoading}
      />
    </div>
  );
};

export default KullaniciYonetimi;
