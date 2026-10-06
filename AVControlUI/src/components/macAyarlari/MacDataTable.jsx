import { useMemo, useState } from "react";
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

  const isTakim = type === "takim";

  // ================================================================
  // ARAMA / FİLTRELEME
  // ================================================================

  const filteredData = useMemo(() => {
    const sourceData = Array.isArray(data) ? data : [];

    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("tr-TR");

    if (!normalizedSearch) {
      return sourceData;
    }

    return sourceData.filter((item) => {
      const targetName = (isTakim ? item?.takimAdi : item?.ligAdi) || "";

      const adEslesiyor = targetName
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedSearch);

      if (adEslesiyor) {
        return true;
      }

      // Takım tablosunda lig adına göre de arama yapılabilsin
      if (isTakim && Array.isArray(item?.ligler)) {
        return item.ligler.some((ligAdi) =>
          ligAdi.toLocaleLowerCase("tr-TR").includes(normalizedSearch),
        );
      }

      return false;
    });
  }, [data, searchTerm, isTakim]);

  return (
    <div
      className="
        flex
        h-[600px]
        min-w-0
        flex-col
        overflow-hidden
        rounded-3xl
        border
        border-slate-700
        bg-slate-800/50
        shadow-xl
        backdrop-blur-sm
        animate-fade-in-up
      "
    >
      {/* ============================================================
          HEADER
      ============================================================ */}

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/50 p-4 sm:p-5">
        <h2 className="flex min-w-0 items-center gap-3 text-base font-bold text-white sm:text-lg">
          <FontAwesomeIcon icon={icon} className="shrink-0 text-cyan-400" />

          <span className="truncate">{title}</span>
        </h2>

        <button
          type="button"
          onClick={() => onAdd(type)}
          className="
            flex
            shrink-0
            items-center
            gap-2
            rounded-xl
            border
            border-cyan-500/30
            bg-cyan-500/10
            px-3
            py-2
            text-sm
            font-bold
            text-cyan-400
            transition

            hover:bg-cyan-500
            hover:text-slate-950

            sm:px-4
          "
        >
          <FontAwesomeIcon icon={faPlus} />

          <span className="hidden sm:inline">Yeni Ekle</span>
        </button>
      </div>

      {/* ============================================================
          ARAMA
      ============================================================ */}

      <div className="shrink-0 border-b border-slate-800 p-4">
        <div className="relative w-full">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500"
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={`${title} içinde ara...`}
            className="
              h-10
              w-full
              rounded-xl
              border
              border-slate-700/80
              bg-slate-950/70
              pl-10
              pr-4
              text-sm
              text-slate-100
              outline-none
              transition

              placeholder:text-slate-500

              focus:border-cyan-400/70
              focus:ring-2
              focus:ring-cyan-400/10
            "
          />
        </div>
      </div>

      {/* ============================================================
          TABLO
      ============================================================ */}

      <div className="min-h-0 flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-700">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900/95 text-xs uppercase tracking-widest text-slate-400 backdrop-blur-sm">
            <tr>
              <th className="px-5 py-3 font-semibold">
                {isTakim ? "Takım / Organizasyonlar" : "Lig Adı"}
              </th>

              <th className="w-[110px] px-5 py-3 text-center font-semibold">
                Durum
              </th>

              <th className="w-[110px] px-5 py-3 text-right font-semibold">
                İşlemler
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/50 text-sm">
            {/* LOADING */}
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-14 text-center">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-2xl text-cyan-400"
                  />

                  <p className="mt-3 text-xs text-slate-500">
                    Veriler yükleniyor...
                  </p>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              /* BOŞ */
              <tr>
                <td colSpan={3} className="px-6 py-14 text-center">
                  <p className="font-medium text-slate-400">
                    Kayıt bulunamadı.
                  </p>

                  {searchTerm && (
                    <p className="mt-1 text-xs text-slate-600">
                      Arama kriterinizi değiştirin.
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              /* KAYITLAR */
              filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-700/30"
                >
                  {/* AD / TAKIM LİGLERİ */}
                  <td className="px-5 py-3.5 align-middle">
                    <div className="max-w-[420px]">
                      <p className="truncate text-sm font-bold text-white sm:text-base">
                        {isTakim ? item.takimAdi : item.ligAdi}
                      </p>

                      {/* TAKIMIN SEÇİLİ LİGLERİ */}
                      {isTakim && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {Array.isArray(item.ligler) &&
                          item.ligler.length > 0 ? (
                            item.ligler.map((ligAdi) => (
                              <span
                                key={ligAdi}
                                title={ligAdi}
                                className="
                                  inline-flex
                                  max-w-[200px]
                                  items-center
                                  rounded-md
                                  border
                                  border-cyan-500/15
                                  bg-cyan-500/5
                                  px-2
                                  py-1
                                  text-[9px]
                                  font-semibold
                                  text-cyan-300
                                "
                              >
                                <span className="truncate">{ligAdi}</span>
                              </span>
                            ))
                          ) : (
                            <span className="rounded-md border border-amber-500/15 bg-amber-500/5 px-2 py-1 text-[9px] font-semibold text-amber-400">
                              Lig seçilmemiş
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* DURUM */}
                  <td className="px-5 py-3 text-center align-middle">
                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        border
                        px-2.5
                        py-1
                        text-[10px]
                        font-bold

                        ${
                          item.aktifMi
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : "border-red-500/20 bg-red-500/10 text-red-400"
                        }
                      `}
                    >
                      <span
                        className={`
                          h-1.5
                          w-1.5
                          rounded-full
                          shadow-[0_0_8px_currentColor]

                          ${item.aktifMi ? "bg-emerald-400" : "bg-red-400"}
                        `}
                      />

                      {item.aktifMi ? "AKTİF" : "PASİF"}
                    </span>
                  </td>

                  {/* İŞLEMLER */}
                  <td className="px-5 py-3 text-right align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(type, item)}
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-lg
                          bg-slate-800
                          text-cyan-400
                          transition

                          hover:bg-cyan-500
                          hover:text-white
                        "
                        title="Düzenle"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(type, item.id)}
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-lg
                          bg-slate-800
                          text-red-400
                          transition

                          hover:bg-red-500
                          hover:text-white
                        "
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

      {/* ALT BİLGİ */}
      {!loading && (
        <div className="shrink-0 border-t border-slate-800 bg-slate-900/30 px-5 py-2.5">
          <p className="text-[10px] font-medium text-slate-500">
            {filteredData.length} kayıt gösteriliyor
          </p>
        </div>
      )}
    </div>
  );
};

export default MacDataTable;
