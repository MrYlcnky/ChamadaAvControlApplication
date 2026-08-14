import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faKey,
  faLock,
  faSpinner,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import api from "../services/api";

const PasswordInput = ({
  label,
  value,
  onChange,
  show,
  setShow,
  placeholder,
  autoComplete,
  loading,
}) => {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </label>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <FontAwesomeIcon
            icon={faLock}
            className="text-slate-500 group-focus-within:text-cyan-400 transition-colors"
          />
        </div>

        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={loading}
          className="w-full pl-12 pr-12 py-3.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-all disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          disabled={loading}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-60"
        >
          <FontAwesomeIcon icon={show ? faEyeSlash : faEye} />
        </button>
      </div>
    </div>
  );
};

const PasswordModal = ({ isOpen, onClose }) => {
  const [mevcutSifre, setMevcutSifre] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState("");
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showNewRepeat, setShowNewRepeat] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setMevcutSifre("");
    setYeniSifre("");
    setYeniSifreTekrar("");
    setShowCurrent(false);
    setShowNew(false);
    setShowNewRepeat(false);
  };

  const handleClose = () => {
    if (loading) return;

    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mevcutSifre || !yeniSifre || !yeniSifreTekrar) {
      toast.warning("Lütfen tüm şifre alanlarını doldurun.");
      return;
    }

    if (yeniSifre !== yeniSifreTekrar) {
      toast.warning("Yeni şifreler birbiriyle eşleşmiyor.");
      return;
    }

    if (mevcutSifre === yeniSifre) {
      toast.warning("Yeni şifre mevcut şifre ile aynı olamaz.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/Auth/sifre-degistir", {
        mevcutSifre,
        yeniSifre,
      });

      toast.success("Şifreniz başarıyla değiştirildi.");

      resetForm();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.mesaj ||
          "Şifre değiştirilemedi. Bilgilerinizi kontrol edin.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm px-4">
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="relative w-full max-w-md rounded-3xl border border-cyan-500/20 bg-slate-950 shadow-2xl shadow-black/70 overflow-hidden animate-fade-in-up">
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-300 flex items-center justify-center border border-cyan-500/20">
              <FontAwesomeIcon icon={faKey} />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-white">
                Şifre Değiştir
              </h2>
              <p className="text-xs text-slate-500">
                Hesap güvenliğiniz için yeni şifre belirleyin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="w-10 h-10 rounded-xl bg-slate-900 text-slate-400 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative p-6 space-y-5">
          <PasswordInput
            label="Mevcut Şifre"
            value={mevcutSifre}
            onChange={setMevcutSifre}
            show={showCurrent}
            setShow={setShowCurrent}
            placeholder="Mevcut şifrenizi girin"
            autoComplete="current-password"
            loading={loading}
          />

          <PasswordInput
            label="Yeni Şifre"
            value={yeniSifre}
            onChange={setYeniSifre}
            show={showNew}
            setShow={setShowNew}
            placeholder="Yeni şifrenizi girin"
            autoComplete="new-password"
            loading={loading}
          />

          <PasswordInput
            label="Yeni Şifre Tekrar"
            value={yeniSifreTekrar}
            onChange={setYeniSifreTekrar}
            show={showNewRepeat}
            setShow={setShowNewRepeat}
            placeholder="Yeni şifrenizi tekrar girin"
            autoComplete="new-password"
            loading={loading}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors font-semibold disabled:opacity-60"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              disabled={loading}
              className="min-w-36 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:via-cyan-700 hover:to-indigo-700 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Kaydediliyor
                </span>
              ) : (
                "Şifreyi Güncelle"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
