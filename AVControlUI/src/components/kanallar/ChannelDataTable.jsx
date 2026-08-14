import { useState, useMemo, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faTrash,
  faSpinner,
  faMagnifyingGlass,
  faSort,
  faSortUp,
  faSortDown,
  faChevronLeft,
  faChevronRight,
  faRotateRight,
  faChevronDown,
  faCheck,
  faTimes,
  faImage,
  faTv,
} from "@fortawesome/free-solid-svg-icons";

const CustomSelect = ({ value, onChange, options, className = "" }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-sm font-semibold outline-none transition-all duration-200 ${
          open
            ? "border-cyan-400/70 bg-slate-950 text-cyan-300 ring-4 ring-cyan-400/10"
            : "border-slate-700/80 bg-slate-950/70 text-slate-200 hover:border-cyan-400/40 hover:text-cyan-300"
        }`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-xs transition-transform duration-200 ${
            open ? "rotate-180 text-cyan-300" : "text-slate-500"
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[90] w-full overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl shadow-black/40">
          <div className="max-h-64 overflow-auto p-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150 ${
                    isSelected
                      ? "bg-cyan-500/10 text-cyan-300"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const SortableTh = ({ label, sortKey, sortConfig, onSort, className = "" }) => {
  const getSortIcon = () => {
    if (sortConfig.key !== sortKey) return faSort;
    return sortConfig.direction === "asc" ? faSortUp : faSortDown;
  };

  return (
    <th className={`px-6 py-4 font-semibold ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-2 text-left transition-colors hover:text-cyan-300"
      >
        <span>{label}</span>
        <FontAwesomeIcon
          icon={getSortIcon()}
          className="text-[11px] opacity-70"
        />
      </button>
    </th>
  );
};

const ChannelDataTable = ({
  channels = [],
  loading = false,
  onRefresh,
  onEdit,
  onDelete,
  activeSourceName,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [sortConfig, setSortConfig] = useState({
    key: "kanalNumarasi", // Varsayılan olarak kanal numarasına göre sıralansın
    direction: "asc",
  });

  const statusOptions = [
    { value: "all", label: "Tüm Durumlar" },
    { value: "active", label: "Aktif Kanallar" },
    { value: "passive", label: "Pasif Kanallar" },
  ];

  const rowsPerPageOptions = [
    { value: 5, label: "5" },
    { value: 10, label: "10" },
    { value: 25, label: "25" },
    { value: 50, label: "50" },
  ];

  const handleSort = (key) => {
    setCurrentPage(1);
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredAndSortedData = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = channels.filter((item) => {
      const searchText = [
        item.kanalAdi,
        item.kanalNumarasi,
        item.aktifMi ? "aktif" : "pasif",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.aktifMi) ||
        (statusFilter === "passive" && !item.aktifMi);

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      const key = sortConfig.key;

      let aValue = a[key];
      let bValue = b[key];

      if (key === "aktifMi" || key === "kullanicidaGosterilsinMi") {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }

      if (key === "kanalNumarasi") {
        aValue = Number(aValue || 0);
        bValue = Number(bValue || 0);
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      return sortConfig.direction === "asc"
        ? String(aValue ?? "").localeCompare(String(bValue ?? ""), "tr")
        : String(bValue ?? "").localeCompare(String(aValue ?? ""), "tr");
    });

    return filtered;
  }, [channels, searchTerm, statusFilter, sortConfig]);

  const totalRecords = filteredAndSortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = filteredAndSortedData.slice(
    (safeCurrentPage - 1) * rowsPerPage,
    safeCurrentPage * rowsPerPage,
  );
  const startRecord =
    totalRecords === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1;
  const endRecord = Math.min(safeCurrentPage * rowsPerPage, totalRecords);

  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-800/50 shadow-xl backdrop-blur-sm">
      <div className="relative z-30 flex flex-col gap-4 border-b border-slate-800 p-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-md">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Kanal adı veya numarası ara..."
            className="h-12 w-full rounded-2xl border border-slate-700/80 bg-slate-950/70 pl-11 pr-4 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-400/10"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <CustomSelect
            value={statusFilter}
            options={statusOptions}
            className="w-[180px]"
            onChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          />
          <CustomSelect
            value={rowsPerPage}
            options={rowsPerPageOptions}
            className="w-[90px]"
            onChange={(value) => {
              setRowsPerPage(Number(value));
              setCurrentPage(1);
            }}
          />
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-950/70 px-4 text-sm font-semibold text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faRotateRight} spin={loading} /> Yenile
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/80 text-xs uppercase tracking-widest text-slate-400">
              <SortableTh
                label="Kanal Adı"
                sortKey="kanalAdi"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Numara"
                sortKey="kanalNumarasi"
                sortConfig={sortConfig}
                onSort={handleSort}
                className="text-center"
              />
              <SortableTh
                label="Arayüzde Göster"
                sortKey="kullanicidaGosterilsinMi"
                sortConfig={sortConfig}
                onSort={handleSort}
                className="text-center"
              />
              <SortableTh
                label="Durum"
                sortKey="aktifMi"
                sortConfig={sortConfig}
                onSort={handleSort}
                className="text-center"
              />
              <th className="px-6 py-4 text-right font-semibold">İşlemler</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/50 text-sm">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-14 text-center">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-4xl text-indigo-400"
                  />
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-14 text-center">
                  <FontAwesomeIcon
                    icon={faTv}
                    className="text-6xl mb-4 opacity-30 text-slate-400"
                  />
                  <p className="text-lg text-slate-400">
                    Bu cihaza ait kanal bulunamadı.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    "{activeSourceName}" için arama kriterlerini değiştirin veya
                    yeni kanal ekleyin.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-700/30"
                >
                  <td className="px-6 py-4 font-bold text-white flex items-center gap-4">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-center shadow-inner">
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={item.kanalAdi}
                          className="h-full w-full object-contain p-1.5"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faImage}
                          className="text-slate-500 text-lg"
                        />
                      )}
                    </div>
                    <span className="text-base">{item.kanalAdi}</span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-block rounded-lg bg-slate-900/80 px-4 py-1.5 font-mono text-cyan-400 border border-slate-700/50 font-bold shadow-sm">
                      CH-{item.kanalNumarasi}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    {item.kullanicidaGosterilsinMi ? (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                        <FontAwesomeIcon icon={faCheck} />
                      </span>
                    ) : (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                        <FontAwesomeIcon icon={faTimes} />
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${item.aktifMi ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor] ${item.aktifMi ? "bg-emerald-400" : "bg-red-400"}`}
                      ></span>
                      {item.aktifMi ? "AKTİF" : "PASİF"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-cyan-400 transition-colors hover:bg-cyan-500 hover:text-white"
                        title="Düzenle"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-red-400 transition-colors hover:bg-red-500 hover:text-white"
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

      <div className="flex flex-col gap-4 border-t border-slate-800 p-5 text-sm text-slate-400 xl:flex-row xl:items-center xl:justify-between">
        <div>
          Toplam{" "}
          <span className="font-bold text-slate-200">{totalRecords}</span>{" "}
          kayıttan{" "}
          <span className="font-bold text-slate-200">{startRecord}</span> -{" "}
          <span className="font-bold text-slate-200">{endRecord}</span> arası
          gösteriliyor.
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safeCurrentPage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/70 text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className="min-w-28 text-center text-slate-300">
            Sayfa{" "}
            <span className="font-bold text-white">{safeCurrentPage}</span> /{" "}
            <span className="font-bold text-white">{totalPages}</span>
          </span>
          <button
            type="button"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={safeCurrentPage === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/70 text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelDataTable;
