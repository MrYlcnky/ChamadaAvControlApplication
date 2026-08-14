import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faSpinner,
  faPenToSquare,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

const MacDataTable = ({
  title,
  icon,
  data,
  type,
  loading,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const targetName = (type === "takim" ? item.takimAdi : item.ligAdi) || "";
      return targetName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, type]);

  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-800/50 shadow-xl backdrop-blur-sm animate-fade-in-up flex flex-col h-[600px]">
      {/* BAŞLIK VE EKLE BUTONU */}
      <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/50 rounded-t-3xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-3">
          <FontAwesomeIcon icon={icon} className="text-cyan-400" />
          {title}
        </h2>
        <button
          onClick={() => onAdd(type)}
          className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 font-bold text-cyan-400 transition-colors hover:bg-cyan-500 hover:text-slate-950"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span className="hidden sm:inline">Yeni Ekle</span>
        </button>
      </div>

      {/* ARAMA ÇUBUĞU */}
      <div className="p-4 border-b border-slate-800">
        <div className="relative w-full">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`${title} içinde ara...`}
            className="h-10 w-full rounded-xl border border-slate-700/80 bg-slate-950/70 pl-10 pr-4 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10"
          />
        </div>
      </div>

      {/* TABLO */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-sm text-xs uppercase tracking-widest text-slate-400 border-b border-slate-700">
            <tr>
              <th className="px-5 py-3 font-semibold">
                {type === "takim" ? "Takım Adı" : "Lig Adı"}
              </th>
              <th className="px-5 py-3 text-center font-semibold">Durum</th>
              <th className="px-5 py-3 text-right font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 text-sm">
            {loading ? (
              <tr>
                <td colSpan="3" className="px-6 py-10 text-center">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-2xl text-cyan-400"
                  />
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan="3"
                  className="px-6 py-10 text-center text-slate-400"
                >
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-700/30"
                >
                  <td className="px-5 py-3 font-bold text-white text-base truncate max-w-[150px]">
                    {type === "takim" ? item.takimAdi : item.ligAdi}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        item.aktifMi
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor] ${
                          item.aktifMi ? "bg-emerald-400" : "bg-red-400"
                        }`}
                      ></span>
                      {item.aktifMi ? "AKTİF" : "PASİF"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(type, item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-cyan-400 transition-colors hover:bg-cyan-500 hover:text-white"
                        title="Düzenle"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        onClick={() => onDelete(type, item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-red-400 transition-colors hover:bg-red-500 hover:text-white"
                        title="Sil"
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
  );
};

export default MacDataTable;
