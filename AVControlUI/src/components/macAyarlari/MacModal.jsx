import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCheck, faSpinner } from "@fortawesome/free-solid-svg-icons";

const MacModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  type,
  itemToEdit,
  actionLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl animate-scale-in overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/30 p-6">
          <h3 className="text-xl font-bold text-white">
            {itemToEdit
              ? "Kaydı Düzenle"
              : `Yeni ${type === "takim" ? "Takım" : "Lig"} Ekle`}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="h-8 w-8 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              {type === "takim" ? "Takım Adı" : "Lig Adı"}
            </label>
            <input
              type="text"
              required
              value={formData.ad}
              onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
              className="h-14 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
              placeholder={`Örn: ${type === "takim" ? "Galatasaray" : "Süper Lig"}`}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                Sistemde Aktif Mi?
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
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 transition-all"
            >
              <FontAwesomeIcon
                icon={actionLoading ? faSpinner : faCheck}
                spin={actionLoading}
              />
              {itemToEdit ? "Değişiklikleri Kaydet" : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MacModal;
