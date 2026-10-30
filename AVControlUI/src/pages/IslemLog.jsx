import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faMagnifyingGlass,
  faRotateRight,
  faChevronLeft,
  faChevronRight,
  faFilter,
  faChevronDown,
  faCheck,
  faUsers,
  faLayerGroup,
  faCalendarDays,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import islemLogService from "../services/islemLogService";

const BOS_FILTRE = {
  arama: "",
  kullaniciId: "",
  islemTipi: "",
  baslangic: "",
  bitis: "",
};

const INITIAL_RESULT = {
  items: [],
  page: 1,
  pageSize: 25,
  totalCount: 0,
  totalPages: 0,
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Tarayıcının standart select menüsü yerine tamamen özelleştirilmiş,
// klavyeyle kullanılabilen aramalı açılır seçim bileşeni.
const ModernSelect = ({
  label,
  value,
  options,
  onChange,
  icon = faFilter,
  searchable = true,
  compact = false,
  hideLabel = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const optionRefs = useRef([]);
  const listId = useId();

  const selected = options.find(
    (option) => String(option.value) === String(value),
  );
  const filteredOptions = useMemo(() => {
    const searchText = search.trim().toLocaleLowerCase("tr-TR");
    return searchText
      ? options.filter((option) =>
          String(option.label).toLocaleLowerCase("tr-TR").includes(searchText),
        )
      : options;
  }, [options, search]);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (open)
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const selectOption = (option) => {
    onChange(option.value);
    setOpen(false);
    setSearch("");
    setActiveIndex(0);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setSearch("");
        setActiveIndex(0);
        setOpen(true);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        Math.min(index + 1, filteredOptions.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter" && event.target.tagName === "INPUT") {
      // Formun yanlışlıkla gönderilmesini önle.
      event.preventDefault();
      if (filteredOptions[activeIndex])
        selectOption(filteredOptions[activeIndex]);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative min-w-0"
      onKeyDown={handleKeyDown}
    >
      {!hideLabel && (
        <span className="mb-2 block text-[11px] font-semibold text-slate-400">
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          setSearch("");
          setActiveIndex(0);
          setOpen((previous) => !previous);
        }}
        className={`flex w-full min-w-0 items-center gap-2.5 rounded-xl border text-left shadow-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${compact ? "h-9 px-3" : "h-11 px-3.5"} ${open ? "border-cyan-400/70 bg-slate-800 text-white ring-2 ring-cyan-500/15" : "border-slate-700/80 bg-slate-950/75 text-slate-200 hover:border-slate-500 hover:bg-slate-800/80"}`}
      >
        <FontAwesomeIcon
          icon={icon}
          className="shrink-0 text-xs text-cyan-400/80"
        />
        <span
          className={`min-w-0 flex-1 truncate ${compact ? "text-xs" : "text-sm"}`}
        >
          {selected?.label || "Seçiniz"}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`shrink-0 text-xs text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-cyan-300" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute top-[calc(100%+8px)] z-[100] w-full overflow-hidden rounded-2xl border border-slate-600/80 bg-slate-900 p-1.5 shadow-[0_22px_65px_rgba(0,0,0,0.7)] ring-1 ring-white/5 ${compact ? "right-0 min-w-[190px]" : "left-0 min-w-[210px]"}`}
        >
          {searchable && (
            <div className="relative m-1 mb-2">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-cyan-400"
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                autoComplete="off"
                placeholder="Seçenek ara..."
                aria-label={`${label} içinde ara`}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setActiveIndex(0);
                }}
                className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 pr-3 pl-9 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/70"
              />
            </div>
          )}
          <div
            id={listId}
            role="listbox"
            aria-label={label}
            className="max-h-60 scrollbar-thin scrollbar-thumb-slate-600 space-y-0.5 overflow-y-auto overscroll-contain p-1"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-5 text-center text-xs text-slate-400">
                Eşleşen seçenek bulunamadı.
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <button
                    key={String(option.value)}
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectOption(option)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-colors ${isSelected ? "bg-cyan-500/15 text-cyan-300" : index === activeIndex ? "bg-slate-700/70 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {isSelected && (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="shrink-0 text-cyan-400"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-slate-800 px-3 py-2 text-[10px] text-slate-500">
            {filteredOptions.length} seçenek · Esc ile kapat
          </div>
        </div>
      )}
    </div>
  );
};

const localDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const IslemLog = () => {
  const [filters, setFilters] = useState({ ...BOS_FILTRE });
  const [appliedFilters, setAppliedFilters] = useState({ ...BOS_FILTRE });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [reloadKey, setReloadKey] = useState(0);

  const [result, setResult] = useState(INITIAL_RESULT);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [options, setOptions] = useState({
    kullanicilar: [],
    islemTipleri: [],
  });

  useEffect(() => {
    let mounted = true;

    islemLogService
      .filtreSecenekleri()
      .then((data) => {
        if (!mounted) return;
        setOptions({
          kullanicilar: data?.kullanicilar ?? [],
          islemTipleri: data?.islemTipleri ?? [],
        });
      })
      .catch((error) => {
        console.error("Log filtreleri yüklenemedi:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const loadLogs = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const data = await islemLogService.listele(
          {
            page,
            pageSize,
            arama: appliedFilters.arama || undefined,
            kullaniciId: appliedFilters.kullaniciId || undefined,
            islemTipi: appliedFilters.islemTipi || undefined,
            baslangic: appliedFilters.baslangic || undefined,
            bitis: appliedFilters.bitis || undefined,
          },
          controller.signal,
        );

        if (!active) return;

        setResult({
          items: Array.isArray(data?.items) ? data.items : [],
          page: data?.page ?? 1,
          pageSize: data?.pageSize ?? pageSize,
          totalCount: data?.totalCount ?? 0,
          totalPages: data?.totalPages ?? 0,
        });

        // Çok sayıda kayıt silindiğinde backend sayfayı kısabilir.
        if (data?.page && data.page !== page) {
          setPage(data.page);
        }
      } catch (error) {
        if (!active || error?.code === "ERR_CANCELED") return;
        console.error("İşlem logları getirilemedi:", error);
        setLoadError("Log kayıtları yüklenemedi. Tekrar deneyin.");
        toast.error("Log kayıtları getirilemedi.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadLogs();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, pageSize, appliedFilters, reloadKey]);

  const userOptions = useMemo(
    () => [
      { value: "", label: "Tüm kullanıcılar" },
      ...options.kullanicilar.map((user) => ({
        value: String(user.id),
        label:
          [user.ad, user.soyad].filter(Boolean).join(" ").trim() ||
          user.kullaniciAdi ||
          `Kullanıcı #${user.id}`,
      })),
    ],
    [options.kullanicilar],
  );

  const typeOptions = useMemo(
    () => [
      { value: "", label: "Tüm işlemler" },
      ...options.islemTipleri.filter(Boolean).map((type) => ({
        value: type,
        label: type,
      })),
    ],
    [options.islemTipleri],
  );

  const countFilters = Object.values(appliedFilters).filter(
    (value) => String(value).trim() !== "",
  ).length;

  const applyQuickDate = (days) => {
    const today = new Date();
    const end = localDate(today);
    const start = new Date(today);
    start.setDate(today.getDate() - days + 1);
    const next = {
      ...filters,
      baslangic: days === 0 ? "" : localDate(start),
      bitis: days === 0 ? "" : end,
      arama: filters.arama.trim(),
    };
    setFilters(next);
    setPage(1);
    setAppliedFilters(next);
  };

  const quickRangeActive = (days) => {
    if (days === 0) return !filters.baslangic && !filters.bitis;
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - days + 1);
    return (
      filters.baslangic === localDate(start) && filters.bitis === localDate(now)
    );
  };

  const pageNumbers = useMemo(() => {
    const total = result.totalPages;
    if (total < 1) return [];
    const current = result.page;
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const end = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [result.page, result.totalPages]);

  const setField = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();

    if (
      filters.baslangic &&
      filters.bitis &&
      filters.baslangic > filters.bitis
    ) {
      toast.warning("Başlangıç tarihi bitiş tarihinden sonra olamaz.");
      return;
    }

    setPage(1);
    setAppliedFilters({
      ...filters,
      arama: filters.arama.trim(),
    });
  };

  const resetFilters = () => {
    setFilters({ ...BOS_FILTRE });
    setAppliedFilters({ ...BOS_FILTRE });
    setPage(1);
  };

  const reload = () => setReloadKey((n) => n + 1);

  return (
    <div className="min-w-0 space-y-5 p-3 sm:p-5 xl:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-xl font-black text-white sm:text-2xl">
            <FontAwesomeIcon icon={faClipboardList} className="text-cyan-400" />
            İşlem Logları
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Kullanıcı işlemlerini tarih, işlem türü ve kullanıcıya göre
            inceleyin.
          </p>
        </div>

        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-500/50 hover:text-cyan-300 disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faRotateRight} spin={loading} />
          Yenile
        </button>
      </div>

      {/* Modern filtre alanı */}
      <form
        onSubmit={applyFilters}
        className="relative z-30 overflow-visible rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 shadow-xl shadow-black/10 sm:p-5"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-300">
              <FontAwesomeIcon icon={faFilter} />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                Gelişmiş Filtreler
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Logları veritabanının tamamında filtrele
              </p>
            </div>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-[11px] font-semibold text-slate-300">
            {countFilters > 0 ? `${countFilters} aktif filtre` : "Tüm kayıtlar"}
          </span>
        </div>

        {/* Arama ve özel stilli seçiciler */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
          <label className="block min-w-0 xl:col-span-4">
            <span className="mb-2 block text-[11px] font-semibold text-slate-400">
              Loglarda ara
            </span>
            <div className="relative">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-cyan-400/80"
              />
              <input
                type="search"
                maxLength={100}
                value={filters.arama}
                onChange={(event) => setField("arama", event.target.value)}
                placeholder="İşlem, kullanıcı veya detay ara..."
                className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/75 py-2 pr-3 pl-10 text-sm text-white transition outline-none placeholder:text-slate-500 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-500/15"
              />
            </div>
          </label>

          <div className="min-w-0 xl:col-span-4">
            <ModernSelect
              label="Kullanıcı"
              value={filters.kullaniciId}
              onChange={(value) => setField("kullaniciId", value)}
              options={userOptions}
              icon={faUsers}
            />
          </div>

          <div className="min-w-0 xl:col-span-4">
            <ModernSelect
              label="İşlem türü"
              value={filters.islemTipi}
              onChange={(value) => setField("islemTipi", value)}
              options={typeOptions}
              icon={faLayerGroup}
            />
          </div>

          <label className="block min-w-0 xl:col-span-6">
            <span className="mb-2 block text-[11px] font-semibold text-slate-400">
              Başlangıç tarihi
            </span>
            <div className="relative">
              <FontAwesomeIcon
                icon={faCalendarDays}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-cyan-400/80"
              />
              <input
                type="date"
                style={{ colorScheme: "dark" }}
                value={filters.baslangic}
                max={filters.bitis || undefined}
                onChange={(event) => setField("baslangic", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/75 py-2 pr-3 pl-10 text-sm text-white transition outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-500/15"
              />
            </div>
          </label>

          <label className="block min-w-0 xl:col-span-6">
            <span className="mb-2 block text-[11px] font-semibold text-slate-400">
              Bitiş tarihi
            </span>
            <div className="relative">
              <FontAwesomeIcon
                icon={faCalendarDays}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-cyan-400/80"
              />
              <input
                type="date"
                style={{ colorScheme: "dark" }}
                value={filters.bitis}
                min={filters.baslangic || undefined}
                onChange={(event) => setField("bitis", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/75 py-2 pr-3 pl-10 text-sm text-white transition outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-500/15"
              />
            </div>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-700/60 pt-4">
          <span className="mr-1 text-[11px] font-semibold text-slate-400">
            Hızlı tarih:
          </span>
          {[
            { label: "Bugün", days: 1 },
            { label: "Son 7 gün", days: 7 },
            { label: "Son 30 gün", days: 30 },
            { label: "Tüm zamanlar", days: 0 },
          ].map((option) => (
            <button
              key={option.days}
              type="button"
              onClick={() => applyQuickDate(option.days)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${quickRangeActive(option.days) ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300" : "border-slate-700 bg-slate-800/70 text-slate-400 hover:border-slate-500 hover:text-white"}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            Arama ve seçimler için “Filtreleri Uygula”ya bas.
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:bg-slate-700 hover:text-white"
            >
              <FontAwesomeIcon icon={faXmark} />
              Temizle
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-500 px-5 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/15 transition hover:bg-cyan-400"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              Filtreleri Uygula
            </button>
          </div>
        </div>
      </form>

      <div className="relative rounded-2xl border border-slate-700/60 bg-slate-900/70 shadow-xl">
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
          <div>
            <h2 className="text-sm font-bold text-white">Kayıtlar</h2>
            <p className="mt-1 text-xs text-slate-400">
              {result.totalCount.toLocaleString("tr-TR")} eşleşen kayıt
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="whitespace-nowrap">Sayfa başına</span>
            <div className="w-[128px]">
              <ModernSelect
                label="Sayfa başına kayıt"
                hideLabel
                compact
                searchable={false}
                icon={faClipboardList}
                value={pageSize}
                options={[
                  { value: 25, label: "25 kayıt" },
                  { value: 50, label: "50 kayıt" },
                  { value: 100, label: "100 kayıt" },
                ]}
                onChange={(value) => {
                  setPage(1);
                  setPageSize(Number(value));
                }}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead className="border-b border-slate-700 bg-slate-950/70 text-[11px] tracking-wider text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3">Tarih / Saat</th>
                <th className="px-4 py-3">Kullanıcı</th>
                <th className="px-4 py-3">İşlem Türü</th>
                <th className="px-4 py-3">Detaylar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loadError && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-7 text-center text-sm text-red-300"
                  >
                    {loadError}
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-7 text-center text-sm text-cyan-300"
                  >
                    Loglar yükleniyor...
                  </td>
                </tr>
              )}

              {!loading && !loadError && result.items.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-9 text-center text-sm text-slate-400"
                  >
                    Bu filtrelere uygun işlem kaydı bulunamadı.
                  </td>
                </tr>
              )}

              {!loading &&
                !loadError &&
                result.items.map((log) => (
                  <tr key={log.id} className="transition hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-400">
                      {formatDateTime(log.olusturulmaTarihi)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-200">
                      {log.kullaniciAdSoyad?.trim() ||
                        `Kullanıcı #${log.kullaniciId}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
                        {log.islemTipi || "-"}
                      </span>
                    </td>
                    <td
                      className="max-w-[540px] px-4 py-3 text-xs leading-5 break-words text-slate-300"
                      title={log.detaylar || ""}
                    >
                      {log.detaylar || "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 p-4">
          <span className="text-xs text-slate-400">
            Sayfa {result.page} / {Math.max(1, result.totalPages)}
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || result.page <= 1}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Önceki sayfa"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>

            {pageNumbers.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPage(num)}
                disabled={loading}
                className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-semibold transition ${num === result.page ? "border-cyan-400 bg-cyan-500/20 text-cyan-300" : "border-slate-700 text-slate-300 hover:border-cyan-500/50"} disabled:opacity-40`}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
              disabled={loading || result.page >= result.totalPages}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Sonraki sayfa"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IslemLog;
