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
} from "@fortawesome/free-solid-svg-icons";

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Modal Arka Planı (Tıklayınca Kapanır) */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Modal Kartı */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-av-card-enter">
        {/* Modal Başlık */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {modalMode === "ekle"
              ? "Yeni Kullanıcı Ekle"
              : "Kullanıcıyı Düzenle"}
          </h3>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xl" />
          </button>
        </div>

        {/* Modal Form İçeriği */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="relative group">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 pl-1">
                Ad
              </label>
              <div className="absolute top-[28px] left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon
                  icon={faAddressCard}
                  className="text-gray-400 group-focus-within:text-blue-500"
                />
              </div>
              <input
                type="text"
                name="ad"
                value={formData.ad}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="relative group">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 pl-1">
                Soyad
              </label>
              <div className="absolute top-[28px] left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon
                  icon={faAddressCard}
                  className="text-gray-400 group-focus-within:text-blue-500"
                />
              </div>
              <input
                type="text"
                name="soyad"
                value={formData.soyad}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="relative group">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 pl-1">
                Kullanıcı Adı *
              </label>
              <div className="absolute top-[28px] left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-gray-400 group-focus-within:text-blue-500"
                />
              </div>
              <input
                type="text"
                name="kullaniciAdi"
                value={formData.kullaniciAdi}
                onChange={handleChange}
                required
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* SADECE 2 ROL İÇERECEK ŞEKİLDE DÜZENLENDİ */}
            <div className="relative group">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 pl-1">
                Rol *
              </label>
              <div className="absolute top-[28px] left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon
                  icon={faUserShield}
                  className="text-gray-400 group-focus-within:text-blue-500"
                />
              </div>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="1">Admin</option>
                <option value="2">Kullanıcı</option>
              </select>
            </div>

            <div className="relative group">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 pl-1">
                Bilgisayar Şifresi{" "}
                {modalMode === "ekle" ? "*" : "(Değişmeyecekse boş bırak)"}
              </label>
              <div className="absolute top-[28px] left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon
                  icon={faLock}
                  className="text-gray-400 group-focus-within:text-blue-500"
                />
              </div>
              <input
                type="text"
                name="sifre"
                value={formData.sifre}
                onChange={handleChange}
                required={modalMode === "ekle"}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder={
                  modalMode === "duzenle" ? "Yeni şifre belirle" : "Şifre girin"
                }
              />
            </div>

            <div className="relative group">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 pl-1">
                Kiosk Pin Kodu
              </label>
              <div className="absolute top-[28px] left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon
                  icon={faHashtag}
                  className="text-gray-400 group-focus-within:text-blue-500"
                />
              </div>
              <input
                type="number"
                name="pinKodu"
                value={formData.pinKodu}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Örn: 1453"
              />
            </div>
          </div>

          {/* Aktiflik Switch */}
          <div className="flex items-center gap-3 mb-8">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="aktifMi"
                checked={formData.aktifMi}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
            </label>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Hesap Aktif
            </span>
          </div>

          {/* Butonlar */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70 transition-colors shadow-lg shadow-blue-500/30"
            >
              {actionLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faCheck} />
              )}
              <span>{modalMode === "ekle" ? "Kaydet" : "Güncelle"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KullaniciModal;
