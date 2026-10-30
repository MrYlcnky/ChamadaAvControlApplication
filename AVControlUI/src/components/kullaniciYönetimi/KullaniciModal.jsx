import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faAddressCard,
  faUser,
  faUserShield,
  faLock,
  faHashtag,
  faSpinner,
  faCheck,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

const fieldClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200";

const FieldLabel = ({ children }) => (
  <span className="mb-1.5 block pl-0.5 text-xs font-semibold text-gray-500 dark:text-slate-400">
    {children}
  </span>
);

const KullaniciModal = ({
  isOpen,
  closeModal,
  modalMode,
  formData,
  handleChange,
  handleSubmit,
  actionLoading,
}) => {
  if (!isOpen) return null;

  const isNewUser = modalMode === "ekle";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
        onClick={actionLoading ? undefined : closeModal}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={
          isNewUser ? "Yeni kullanıcı oluştur" : "Kullanıcıyı düzenle"
        }
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-5 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-800/50">
          <div>
            <h3 className="text-lg font-extrabold text-gray-800 dark:text-white">
              {isNewUser ? "Yeni Kullanıcı Oluştur" : "Kullanıcıyı Düzenle"}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
              {isNewUser
                ? "Önce hesabı oluştur; bölge yetkilerini ardından kullanıcı listesinden ata."
                : "Hesap bilgilerini düzenle. Bölge atamaları ayrı pencereden yönetilir."}
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={actionLoading}
            aria-label="Pencereyi kapat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label>
                <FieldLabel>
                  <FontAwesomeIcon icon={faAddressCard} className="mr-1.5" /> Ad
                </FieldLabel>
                <input
                  type="text"
                  name="ad"
                  value={formData.ad}
                  onChange={handleChange}
                  className={fieldClass}
                />
              </label>
              <label>
                <FieldLabel>Soyad</FieldLabel>
                <input
                  type="text"
                  name="soyad"
                  value={formData.soyad}
                  onChange={handleChange}
                  className={fieldClass}
                />
              </label>
              <label>
                <FieldLabel>
                  <FontAwesomeIcon icon={faUser} className="mr-1.5" /> Kullanıcı
                  Adı *
                </FieldLabel>
                <input
                  type="text"
                  name="kullaniciAdi"
                  value={formData.kullaniciAdi}
                  onChange={handleChange}
                  required
                  className={fieldClass}
                />
              </label>
              <label>
                <FieldLabel>
                  <FontAwesomeIcon icon={faUserShield} className="mr-1.5" /> Rol
                  *
                </FieldLabel>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  required
                  className={fieldClass}
                >
                  <option value="1">Admin</option>
                  <option value="2">Normal Kullanıcı</option>
                </select>
              </label>
              <label>
                <FieldLabel>
                  <FontAwesomeIcon icon={faLock} className="mr-1.5" />
                  Şifre {isNewUser ? "*" : "(Değişmeyecekse boş bırak)"}
                </FieldLabel>
                <input
                  type="password"
                  name="sifre"
                  autoComplete="new-password"
                  value={formData.sifre}
                  onChange={handleChange}
                  required={isNewUser}
                  placeholder={
                    isNewUser ? "Şifre oluştur" : "Yeni şifre (isteğe bağlı)"
                  }
                  className={fieldClass}
                />
              </label>
              <label>
                <FieldLabel>
                  <FontAwesomeIcon icon={faHashtag} className="mr-1.5" /> Kiosk
                  PIN Kodu
                </FieldLabel>
                <input
                  type="number"
                  name="pinKodu"
                  value={formData.pinKodu}
                  onChange={handleChange}
                  placeholder="Örn. 1453"
                  className={fieldClass}
                />
              </label>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-950/60">
              <input
                type="checkbox"
                name="aktifMi"
                checked={Boolean(formData.aktifMi)}
                onChange={handleChange}
                className="h-4 w-4 accent-cyan-500"
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                Hesap Aktif
              </span>
            </label>

            <div className="flex items-start gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs leading-relaxed text-cyan-700 dark:text-cyan-200">
              <FontAwesomeIcon
                icon={faCircleInfo}
                className="mt-0.5 shrink-0"
              />
              <p>
                {isNewUser
                  ? "Hesap kaydedildikten sonra Kullanıcı Yönetimi listesindeki Bölge Yetkileri butonuyla bölge atayabilirsin."
                  : "Bölge eklemek veya kaldırmak için kullanıcı listesindeki Bölge Yetkileri butonunu kullan."}
              </p>
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/80 px-5 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={closeModal}
              disabled={actionLoading}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-200 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon
                icon={actionLoading ? faSpinner : faCheck}
                spin={actionLoading}
              />
              {isNewUser ? "Kullanıcıyı Oluştur" : "Güncelle"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default KullaniciModal;
