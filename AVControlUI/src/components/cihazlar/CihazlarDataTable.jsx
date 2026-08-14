import { useState, useMemo, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faServer,
  faSpinner,
  faNetworkWired,
  faMagnifyingGlass,
  faSort,
  faSortUp,
  faSortDown,
  faChevronLeft,
  faChevronRight,
  faRotateRight,
  faChevronDown,
  faCheck,
  faMicrochip,
  faBroadcastTower,
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
    if (sortConfig.key !== sortKey) {
      return faSort;
    }

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

const getDeviceIcon = (cihazTipiKey) => {
  if (cihazTipiKey === "led") return faMicrochip;
  if (cihazTipiKey === "matrix") return faServer;
  if (cihazTipiKey === "pi") return faBroadcastTower;

  return faServer;
};

const getDeviceIconClass = (cihazTipiKey) => {
  if (cihazTipiKey === "led") return "bg-cyan-500/10 text-cyan-300";
  if (cihazTipiKey === "matrix") return "bg-indigo-500/10 text-indigo-300";
  if (cihazTipiKey === "pi") return "bg-emerald-500/10 text-emerald-300";

  return "bg-slate-500/10 text-slate-300";
};

const CihazlarDataTable = ({ cihazlar = [], loading = false, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [sortConfig, setSortConfig] = useState({
    key: "cihazAdi",
    direction: "asc",
  });

  const typeOptions = [
    { value: "all", label: "Tüm Cihazlar" },
    { value: "led", label: "LED Processor" },
    { value: "matrix", label: "Matrix" },
    { value: "pi", label: "Raspberry Pi" },
  ];

  const statusOptions = [
    { value: "all", label: "Tüm Durumlar" },
    { value: "active", label: "Aktif Cihazlar" },
    { value: "passive", label: "Pasif Cihazlar" },
  ];

  const rowsPerPageOptions = [
    { value: 5, label: "5" },
    { value: 10, label: "10" },
    { value: 25, label: "25" },
    { value: 50, label: "50" },
  ];

  const handleSort = (key) => {
    setCurrentPage(1);

    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  };

  const filteredAndSortedData = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const numericFields = ["port", "inputSayisi", "outputSayisi"];

    const filtered = cihazlar.filter((item) => {
      const searchText = [
        item.cihazTipi,
        item.cihazAdi,
        item.ipAdresi,
        item.port,
        item.macAdresi,
        item.inputSayisi,
        item.outputSayisi,
        item.aktifMi ? "aktif" : "pasif",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(normalizedSearch);

      const matchesType =
        typeFilter === "all" || item.cihazTipiKey === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.aktifMi) ||
        (statusFilter === "passive" && !item.aktifMi);

      return matchesSearch && matchesType && matchesStatus;
    });

    filtered.sort((a, b) => {
      const key = sortConfig.key;

      let aValue = a[key];
      let bValue = b[key];

      if (key === "aktifMi") {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }

      if (numericFields.includes(key)) {
        aValue = Number(aValue === "-" ? 0 : aValue || 0);
        bValue = Number(bValue === "-" ? 0 : bValue || 0);

        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      return sortConfig.direction === "asc"
        ? String(aValue ?? "").localeCompare(String(bValue ?? ""), "tr")
        : String(bValue ?? "").localeCompare(String(aValue ?? ""), "tr");
    });

    return filtered;
  }, [cihazlar, searchTerm, typeFilter, statusFilter, sortConfig]);

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
    <div className="space-y-5">
      <div className="rounded-3xl border border-blue-400/10 bg-slate-900/80 shadow-xl shadow-black/20">
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
              placeholder="Cihaz tipi, ad, IP, MAC veya durum ara..."
              className="h-12 w-full rounded-2xl border border-slate-700/80 bg-slate-950/70 pl-11 pr-4 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-400/10"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CustomSelect
              value={typeFilter}
              options={typeOptions}
              className="w-[170px]"
              onChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
            />

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
              className="w-[88px]"
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
              <FontAwesomeIcon icon={faRotateRight} spin={loading} />
              Yenile
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase tracking-widest text-slate-400">
                <SortableTh
                  label="Cihaz"
                  sortKey="cihazAdi"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />

                <SortableTh
                  label="Tip"
                  sortKey="cihazTipi"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />

                <SortableTh
                  label="IP Adresi"
                  sortKey="ipAdresi"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />

                <SortableTh
                  label="Port"
                  sortKey="port"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="text-center"
                />

                <SortableTh
                  label="Input"
                  sortKey="inputSayisi"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="text-center"
                />

                <SortableTh
                  label="Output"
                  sortKey="outputSayisi"
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
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/70 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-14 text-center">
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      className="text-2xl text-cyan-400"
                    />

                    <p className="mt-3 text-sm text-slate-400">
                      Cihazlar yükleniyor...
                    </p>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-14 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
                      <FontAwesomeIcon icon={faServer} />
                    </div>

                    <p className="mt-4 font-bold text-slate-200">
                      Kayıt bulunamadı
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Arama veya filtre kriterlerini değiştirin.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item.uniqueId}
                    className="transition-colors hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${getDeviceIconClass(
                            item.cihazTipiKey,
                          )}`}
                        >
                          <FontAwesomeIcon
                            icon={getDeviceIcon(item.cihazTipiKey)}
                          />
                        </div>

                        <div>
                          <p className="font-bold text-slate-100">
                            {item.cihazAdi}
                          </p>

                          <p className="text-xs text-slate-500">
                            MAC: {item.macAdresi || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                        {item.cihazTipi}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-300">
                      <FontAwesomeIcon
                        icon={faNetworkWired}
                        className="mr-2 text-blue-400"
                      />

                      {item.ipAdresi}
                    </td>

                    <td className="px-6 py-4 text-center font-mono text-slate-300">
                      {item.port}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                        {item.inputSayisi}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
                        {item.outputSayisi}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.aktifMi
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {item.aktifMi ? "Aktif" : "Pasif"}
                      </span>
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
    </div>
  );
};

export default CihazlarDataTable;
