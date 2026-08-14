import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faXmark,
  faImage,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";

const LedProcessorModal = ({
  isOpen,
  closeModal,
  modalMode,
  formData,
  setFormData,
  handleSubmit,
  actionLoading,
}) => {
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape" && !actionLoading) closeModal();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeModal, actionLoading]);

  useEffect(() => {
    if (isOpen) {
      if (formData.gorselDosyasi) {
        const objectUrl = URL.createObjectURL(formData.gorselDosyasi);
        setImagePreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
      } else if (formData.cihazGorselUrl) {
        const baseUrl = import.meta.env.VITE_API_BASE_URL_API.replace(
          "/api",
          "",
        );
        setImagePreview(`${baseUrl}${formData.cihazGorselUrl}`);
      } else {
        setImagePreview(null);
      }
    }
  }, [isOpen, formData.gorselDosyasi, formData.cihazGorselUrl]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;

    if (name === "port") newValue = value.replace(/\D/g, "").slice(0, 5);
    if (name === "macAdresi") newValue = value.toUpperCase();

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, gorselDosyasi: e.target.files[0] }));
    }
  };

  const inputClass =
    "w-full h-12 rounded-2xl bg-slate-950/70 border border-slate-700/80 px-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-400/10 disabled:opacity-60";
  const labelClass = "mb-1.5 block text-xs font-semibold text-slate-400";

  const aktifMi = Boolean(formData.aktifMi);
  const kullanicidaGosterilsinMi = Boolean(formData.kullanicidaGosterilsinMi);
  const viplexKontroluVarMi = Boolean(formData.viplexKontroluVarMi);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={!actionLoading ? closeModal : undefined}
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-slate-900 shadow-2xl shadow-black/40">
        <div className="h-[3px] bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-500" />

        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-7 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/80">
              LED Processor
            </p>
            <h3 className="mt-2 text-2xl font-extrabold text-white">
              {modalMode === "ekle"
                ? "Yeni LED İşlemci Ekle"
                : "İşlemciyi Düzenle"}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Cihaz bağlantı bilgilerini eksiksiz girin.
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={actionLoading}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/60 text-slate-400 transition-colors duration-200 hover:border-red-400/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            title="Kapat"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 px-7 py-6 max-h-[75vh] overflow-y-auto custom-scrollbar"
        >
          {/* Görsel Alanı */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full h-40 border-2 border-dashed border-slate-700/80 rounded-2xl bg-slate-950/40 flex flex-col items-center justify-center hover:border-cyan-400/50 transition-colors cursor-pointer overflow-hidden group">
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Cihaz"
                    className="h-full w-full object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-bold bg-slate-800 px-4 py-2 rounded-xl border border-slate-600">
                      <FontAwesomeIcon icon={faUpload} className="mr-2" />{" "}
                      Değiştir
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-slate-500 flex flex-col items-center group-hover:text-cyan-400 transition-colors">
                  <FontAwesomeIcon icon={faImage} className="text-3xl mb-2" />
                  <span className="text-sm font-medium">
                    Cihaz Fotoğrafı Seç / Sürükle
                  </span>
                  <span className="text-xs opacity-60 mt-1">
                    .jpg, .png, .heic
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Temel Bilgiler: Cihaz Adı ve Marka */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Cihaz Adı *</label>
              <input
                type="text"
                name="cihazAdi"
                value={formData.cihazAdi || ""}
                onChange={handleChange}
                required
                placeholder="Örn: Sahne LED"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Cihaz Marka</label>
              <input
                type="text"
                name="cihazMarka"
                value={formData.cihazMarka || ""}
                onChange={handleChange}
                placeholder="Örn: Novastar"
                className={inputClass}
              />
            </div>
          </div>

          {/* Ağ Bilgiler: IP ve Port */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>IP Adresi *</label>
              <input
                type="text"
                name="ipAdresi"
                value={formData.ipAdresi || ""}
                onChange={handleChange}
                required
                placeholder="192.168.1.100"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Port *</label>
              <input
                type="text"
                name="port"
                value={formData.port || ""}
                onChange={handleChange}
                required
                inputMode="numeric"
                placeholder="5000"
                className={inputClass}
              />
            </div>
          </div>

          {/* Donanım Bilgileri: MAC ve Seri No */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>MAC Adresi</label>
              <input
                type="text"
                name="macAdresi"
                value={formData.macAdresi || ""}
                onChange={handleChange}
                placeholder="AA:BB:CC:DD:EE:FF"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Seri No (SN)</label>
              <input
                type="text"
                name="seriNo"
                value={formData.seriNo || ""}
                onChange={handleChange}
                placeholder="Örn: 25C30A000001751"
                className={inputClass}
              />
            </div>
          </div>

          {/* API Kimlik Bilgileri: Kullanıcı Adı ve Şifre */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>API Kullanıcı Adı</label>
              <input
                type="text"
                name="kullaniciAdi"
                value={formData.kullaniciAdi || ""}
                onChange={handleChange}
                placeholder="Örn: admin"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>API Şifresi</label>
              <input
                type="text"
                name="sifre"
                value={formData.sifre || ""}
                onChange={handleChange}
                placeholder="Örn: SN2008@+"
                className={inputClass}
              />
            </div>
          </div>

          {/* Toggle Ayarlar (ViPlex, Göster, Aktif) */}
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 hover:border-cyan-400/30">
            <div>
              <p className="text-sm font-bold text-slate-100">
                ViPlex Kontrolü Aktif Mi?
              </p>
              <p className="text-xs text-slate-500">
                {viplexKontroluVarMi
                  ? "HDMI/Medya butonları çıkacak."
                  : "Bu cihaz için ekstra buton çıkmayacak."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${viplexKontroluVarMi ? "bg-purple-500/10 text-purple-400" : "bg-slate-500/10 text-slate-400"}`}
              >
                {viplexKontroluVarMi ? "Aktif" : "Pasif"}
              </span>
              <input
                type="checkbox"
                name="viplexKontroluVarMi"
                checked={viplexKontroluVarMi}
                onChange={handleChange}
                className="h-5 w-5 accent-purple-500"
              />
            </div>
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 hover:border-cyan-400/30">
            <div>
              <p className="text-sm font-bold text-slate-100">
                Kullanıcı Görsün Mü?
              </p>
              <p className="text-xs text-slate-500">
                {kullanicidaGosterilsinMi
                  ? "Son kullanıcı ekranında gösterilecek."
                  : "Sadece altyapıda kalır, son kullanıcı göremez."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${kullanicidaGosterilsinMi ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}
              >
                {kullanicidaGosterilsinMi ? "Göster" : "Gizle"}
              </span>
              <input
                type="checkbox"
                name="kullanicidaGosterilsinMi"
                checked={kullanicidaGosterilsinMi}
                onChange={handleChange}
                className="h-5 w-5 accent-cyan-500"
              />
            </div>
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 hover:border-cyan-400/30">
            <div>
              <p className="text-sm font-bold text-slate-100">Cihaz Durumu</p>
              <p className="text-xs text-slate-500">
                {aktifMi
                  ? "Cihaz aktif olarak kaydedilecek."
                  : "Cihaz pasif olarak kaydedilecek."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${aktifMi ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
              >
                {aktifMi ? "Aktif" : "Pasif"}
              </span>
              <input
                type="checkbox"
                name="aktifMi"
                checked={aktifMi}
                onChange={handleChange}
                className="h-5 w-5 accent-cyan-500"
              />
            </div>
          </label>

          {/* Footer Butonları */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={closeModal}
              disabled={actionLoading}
              className="h-11 rounded-2xl px-5 text-sm font-semibold text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex h-11 min-w-32 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-colors hover:from-blue-500 hover:to-cyan-400 disabled:opacity-60"
            >
              {actionLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Kaydediliyor
                </>
              ) : (
                "Kaydet"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LedProcessorModal;
