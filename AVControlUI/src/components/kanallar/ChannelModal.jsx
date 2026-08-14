import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCheck,
  faTimes,
  faImage,
  faMicrochip,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import channelListService from "../../services/channelListService";

const initialFormData = {
  kanalNumarasi: "",
  kanalAdi: "",
  logoUrl: "",
  kullanicidaGosterilsinMi: true,
  aktifMi: true,
};

const ChannelModal = ({
  isOpen,
  onClose,
  onSuccess,
  activeSource,
  itemToEdit,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal açıldığında form verilerini doldur (Düzenleme veya Ekleme moduna göre)
  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setFormData({
          kanalNumarasi: itemToEdit.kanalNumarasi || "",
          kanalAdi: itemToEdit.kanalAdi || "",
          logoUrl: itemToEdit.logoUrl || "",
          kullanicidaGosterilsinMi: Boolean(
            itemToEdit.kullanicidaGosterilsinMi,
          ),
          aktifMi: Boolean(itemToEdit.aktifMi),
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [isOpen, itemToEdit]);

  if (!isOpen || !activeSource) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.kanalAdi || !formData.kanalNumarasi) {
      toast.warning("Lütfen zorunlu alanları doldurun.");
      return;
    }

    const payload = {
      ...formData,
      inputSourceId: activeSource.id,
      kanalNumarasi: parseInt(formData.kanalNumarasi, 10),
    };

    if (itemToEdit) payload.id = itemToEdit.id;

    try {
      setActionLoading(true);
      if (itemToEdit) {
        await channelListService.update(payload);
        toast.success("Kanal güncellendi.");
      } else {
        await channelListService.create(payload);
        toast.success("Kanal başarıyla eklendi.");
      }
      onSuccess(); // Ana sayfadaki listeyi yenilemesi için tetikle
      onClose(); // Modalı kapat
    } catch (err) {
      toast.error(err.response?.data?.mesaj || "İşlem başarısız.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl animate-scale-in overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/30 p-6">
          <div>
            <h3 className="text-xl font-bold text-white">
              {itemToEdit ? "Kanalı Düzenle" : "Yeni Kanal Ekle"}
            </h3>
            <p className="text-xs text-cyan-400 mt-1 font-semibold flex items-center gap-1.5">
              <FontAwesomeIcon icon={faMicrochip} />
              Hedef Cihaz: {activeSource.inputName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300 text-center">
                Kanal Numarası
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.kanalNumarasi}
                onChange={(e) =>
                  setFormData({ ...formData, kanalNumarasi: e.target.value })
                }
                className="h-14 w-full text-center text-xl font-bold font-mono rounded-xl border border-slate-700 bg-slate-950 px-4 text-cyan-400 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                placeholder="000"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Kanal Adı
              </label>
              <input
                type="text"
                required
                value={formData.kanalAdi}
                onChange={(e) =>
                  setFormData({ ...formData, kanalAdi: e.target.value })
                }
                className="h-14 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                placeholder="Örn: TRT 1"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300 flex items-center gap-2">
              <FontAwesomeIcon icon={faImage} className="text-slate-500" />
              Logo URL{" "}
              <span className="text-xs text-slate-500 font-normal">
                (Opsiyonel)
              </span>
            </label>
            <input
              type="text"
              value={formData.logoUrl}
              onChange={(e) =>
                setFormData({ ...formData, logoUrl: e.target.value })
              }
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
              placeholder="https://site.com/logo.png"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                Son Kullanıcı Ekranında Göster
              </span>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.kullanicidaGosterilsinMi}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kullanicidaGosterilsinMi: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>
            <div className="h-px w-full bg-slate-800"></div>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                Kanal Aktif Mi?
              </span>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.aktifMi}
                  onChange={(e) =>
                    setFormData({ ...formData, aktifMi: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </div>
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-6 py-3 font-bold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 transition-all"
            >
              <FontAwesomeIcon
                icon={actionLoading ? faSpinner : faCheck}
                spin={actionLoading}
              />
              {itemToEdit ? "Değişiklikleri Güncelle" : "Kanalı Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChannelModal;
