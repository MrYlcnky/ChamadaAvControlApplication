import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faXmark,
  faGamepad,
} from "@fortawesome/free-solid-svg-icons";

const RemoteControlModal = ({
  isOpen,
  closeModal,
  modalMode,
  formData,
  setFormData,
  handleSubmit,
  actionLoading,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape" && !actionLoading) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closeModal, actionLoading]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const inputClass =
    "h-12 w-full rounded-2xl border border-slate-700/80 bg-slate-950/70 px-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-400/10 disabled:opacity-60";

  const labelClass = "mb-1.5 block text-xs font-semibold text-slate-400";

  const aktifMi = Boolean(formData.aktifMi);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={!actionLoading ? closeModal : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-slate-900 shadow-2xl shadow-black/40">
        {/* Üst çizgi */}
        <div className="h-[3px] bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-7 py-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
              <FontAwesomeIcon icon={faGamepad} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/80">
                Remote Control
              </p>

              <h3 className="mt-2 text-2xl font-extrabold text-white">
                {modalMode === "ekle" ? "Yeni Kumanda Ekle" : "Kumanda Düzenle"}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Kumandanın cihaz tipi, marka/model ve protokol bilgilerini
                girin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={actionLoading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/60 text-slate-400 transition-colors duration-200 hover:border-red-400/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            title="Kapat"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 px-7 py-6">
          <div>
            <label className={labelClass}>Cihaz Tipi *</label>
            <input
              type="text"
              name="cihazTipi"
              value={formData.cihazTipi || ""}
              onChange={handleChange}
              required
              placeholder="Örn: TV, Uydu Alıcısı, LED İşlemci, Matrix, Klima"
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Sabit seçim yerine cihaz tipini manuel yazabilirsiniz.
            </p>
          </div>

          <div>
            <label className={labelClass}>Marka & Model *</label>
            <input
              type="text"
              name="kumandaMarkaModel"
              value={formData.kumandaMarkaModel || ""}
              onChange={handleChange}
              required
              placeholder="Örn: LG Smart TV 2023"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Protokol Tipi</label>
            <input
              type="text"
              name="protokolTipi"
              value={formData.protokolTipi || ""}
              onChange={handleChange}
              placeholder="Örn: NEC, RC5, RC6, Sony SIRC"
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Bilmiyorsanız boş bırakabilirsiniz.
            </p>
          </div>

          {/* Aktif / Pasif */}
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 transition-colors duration-200 hover:border-cyan-400/30">
            <div>
              <p className="text-sm font-bold text-slate-100">Kumanda Durumu</p>

              <p className="text-xs text-slate-500">
                {aktifMi
                  ? "Kumanda aktif olarak kullanılabilir."
                  : "Kumanda pasif olarak kaydedilecek."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  aktifMi
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
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

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={closeModal}
              disabled={actionLoading}
              className="h-11 rounded-2xl px-5 text-sm font-semibold text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex h-11 min-w-32 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-colors duration-200 hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Kaydediliyor
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

export default RemoteControlModal;
