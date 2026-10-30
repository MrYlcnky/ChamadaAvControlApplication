import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCheckDouble,
  faCircleExclamation,
  faFloppyDisk,
  faMagnifyingGlass,
  faShieldHalved,
  faSpinner,
  faTv,
  faXmark,
  faRotateRight,
  faLock,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import kullaniciBolgeService from "../../services/kullaniciBolgeService";

const FILTERS = [
  { value: "tum", label: "Tümü" },
  { value: "secili", label: "Seçili" },
  { value: "secili-degil", label: "Seçili değil" },
];

const errorText = (name, err) => {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const message =
    typeof data === "string"
      ? data.slice(0, 160)
      : data?.mesaj || data?.message || data?.title || err?.message;
  return `${name}: ${status ? `HTTP ${status}` : "Bağlantı hatası"}${message ? ` — ${message}` : ""}`;
};

const BolgeYetkiModal = ({ kullanici, onClose, onSaved }) => {
  const isAdminTarget = Number(kullanici.rol) === 1;
  const [zones, setZones] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [initialIds, setInitialIds] = useState([]);
  const [hiddenIds, setHiddenIds] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("tum");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const searchRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    searchRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      const [zonesResult, rightsResult] = await Promise.allSettled([
        kullaniciBolgeService.getBolgeler(kullanici.id, controller.signal),
        kullaniciBolgeService.getKullaniciYetkileri(
          kullanici.id,
          controller.signal,
        ),
      ]);

      if (!active) return;

      const errors = [];
      let availableZones = [];
      let savedIds = [];

      if (
        zonesResult.status === "fulfilled" &&
        Array.isArray(zonesResult.value)
      ) {
        availableZones = zonesResult.value;
      } else {
        errors.push(
          zonesResult.status === "rejected"
            ? errorText("Bölge listesi", zonesResult.reason)
            : "Bölge listesi: Sunucu dizi döndürmedi.",
        );
      }

      if (
        rightsResult.status === "fulfilled" &&
        Array.isArray(rightsResult.value?.bolgeIds)
      ) {
        savedIds = [...new Set(rightsResult.value.bolgeIds.map(Number))].filter(
          (id) => Number.isInteger(id) && id > 0,
        );
      } else {
        errors.push(
          rightsResult.status === "rejected"
            ? errorText("Mevcut kullanıcı yetkileri", rightsResult.reason)
            : "Mevcut kullanıcı yetkileri: 'bolgeIds' dizisi bulunamadı.",
        );
      }

      const availableSet = new Set(
        availableZones.map((zone) => Number(zone.id)),
      );
      const visibleSelected = savedIds.filter((id) => availableSet.has(id));
      const noLongerSelectable = savedIds.filter((id) => !availableSet.has(id));

      setZones(availableZones);
      setSelectedIds(visibleSelected);
      setInitialIds(visibleSelected);
      setHiddenIds(noLongerSelectable);
      setError(errors.join("\n"));
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [kullanici.id, reloadKey]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const dirty = useMemo(() => {
    if (selectedIds.length !== initialIds.length) return true;
    const initialSet = new Set(initialIds);
    return selectedIds.some((id) => !initialSet.has(id));
  }, [selectedIds, initialIds]);

  const filteredZones = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    return zones
      .filter((zone) => {
        const selected = selectedSet.has(Number(zone.id));
        if (filter === "secili" && !selected) return false;
        if (filter === "secili-degil" && selected) return false;
        return (
          !query ||
          [zone.bolgeAdi, zone.portKodu, String(zone.matrixDeviceId)].some(
            (v) =>
              String(v ?? "")
                .toLocaleLowerCase("tr-TR")
                .includes(query),
          )
        );
      })
      .sort((a, b) =>
        (a.bolgeAdi || "").localeCompare(b.bolgeAdi || "", "tr-TR"),
      );
  }, [zones, search, selectedSet, filter]);

  const toggle = (id) => {
    if (saving || loading || error) return;
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((v) => v !== id) : [...current, id],
    );
  };

  const selectVisible = () => {
    const visible = filteredZones.map((zone) => Number(zone.id));
    setSelectedIds((current) => [...new Set([...current, ...visible])]);
  };

  const unselectVisible = () => {
    const visible = new Set(filteredZones.map((zone) => Number(zone.id)));
    setSelectedIds((current) => current.filter((id) => !visible.has(id)));
  };

  const closeWithCheck = useCallback(async () => {
    if (saving) return;
    if (dirty) {
      const answer = await Swal.fire({
        title: "Kaydedilmemiş değişiklikler",
        text: "Bölge seçimlerini kaydetmeden kapatmak istiyor musun?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Değişiklikleri sil",
        cancelButtonText: "Düzenlemeye dön",
        confirmButtonColor: "#e11d48",
        cancelButtonColor: "#334155",
        background: "#0f172a",
        color: "#e2e8f0",
      });
      if (!answer.isConfirmed) return;
    }
    onClose();
  }, [saving, dirty, onClose]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void closeWithCheck();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeWithCheck]);

  const save = async () => {
    if (loading || saving || error || !dirty) return;
    setSaving(true);
    try {
      // Yalnızca modalda seçilebilir bölgeleri gönderiyoruz.
      // Backend, görünürlüğü sonradan kapanmış eski atamaları korur.
      const data = await kullaniciBolgeService.kaydet(
        kullanici.id,
        [...selectedIds].sort((a, b) => a - b),
      );
      toast.success("Bölge yetkileri kaydedildi.");
      onSaved?.(kullanici.id, selectedIds.length, data);
      onClose();
    } catch (err) {
      console.error("Bölge yetkisi kaydedilemedi:", err);
      toast.error(
        err?.response?.data?.mesaj || "Bölge yetkileri kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  };

  const displayName = [kullanici.ad, kullanici.soyad]
    .filter(Boolean)
    .join(" ")
    .trim();

  const notReady = loading || saving || Boolean(error);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bolge-yetki-title"
    >
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={() => void closeWithCheck()}
      />

      <section className="relative flex max-h-[min(94vh,850px)] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/60">
        <header className="relative shrink-0 overflow-hidden border-b border-slate-800 px-5 py-5 sm:px-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_50%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
                <FontAwesomeIcon icon={faShieldHalved} className="text-lg" />
              </div>
              <div className="min-w-0">
                <h2
                  id="bolge-yetki-title"
                  className="text-lg font-black text-white"
                >
                  Bölge Yetkilendirme
                </h2>
                <p className="mt-1 truncate text-xs text-slate-400">
                  {displayName || kullanici.kullaniciAdi} · @
                  {kullanici.kullaniciAdi}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {isAdminTarget
                    ? "Admin tüm bölgeleri her durumda görebilir; istersen kayıt amaçlı bölge de atayabilirsin."
                    : "Sadece aktif ve 'Kullanıcı Görsün Mü?' açık LED işlemcilerine bağlı bölgeler atanabilir."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void closeWithCheck()}
              disabled={saving}
              aria-label="Pencereyi kapat"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 transition hover:border-rose-400/50 hover:text-white disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </header>

        <div className="shrink-0 border-b border-slate-800 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative min-w-0 flex-1">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-slate-500"
              />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                disabled={notReady}
                placeholder="Bölge adı, Matrix veya port ara..."
                aria-label="Bölge ara"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-2.5 pr-4 pl-10 text-sm text-white transition outline-none placeholder:text-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 disabled:opacity-50"
              />
            </div>
            <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-950/60 p-1">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  disabled={notReady}
                  onClick={() => setFilter(item.value)}
                  className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-bold whitespace-nowrap transition sm:flex-none ${filter === item.value ? "bg-cyan-500/15 text-cyan-300 shadow-sm" : "text-slate-400 hover:bg-slate-800 hover:text-white"} disabled:opacity-50`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-lg bg-cyan-400/10 px-2 py-1 font-bold text-cyan-300">
                {selectedIds.length} seçili
              </span>
              <span>{filteredZones.length} bölge listeleniyor</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectVisible}
                disabled={notReady || filteredZones.length === 0}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-40"
              >
                <FontAwesomeIcon icon={faCheckDouble} /> Görünenleri seç
              </button>
              <button
                type="button"
                onClick={unselectVisible}
                disabled={notReady || filteredZones.length === 0}
                className="rounded-lg px-2 py-1.5 text-xs font-bold text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-40"
              >
                Görünenleri kaldır
              </button>
            </div>
          </div>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {loading ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-slate-400">
              <FontAwesomeIcon
                icon={faSpinner}
                spin
                className="text-2xl text-cyan-400"
              />
              <p className="text-sm">
                Bölgeler ve mevcut atamalar yükleniyor...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="text-2xl text-rose-400"
              />
              <p className="max-w-lg text-sm break-words whitespace-pre-wrap text-rose-300">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setReloadKey((x) => x + 1)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:border-cyan-400/50"
              >
                <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
                Yeniden dene
              </button>
            </div>
          ) : filteredZones.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center text-slate-400">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-2xl" />
              <p className="text-sm">
                {zones.length === 0
                  ? "Bu kullanıcıya atanabilecek bölge bulunamadı."
                  : "Bu arama veya filtreye uygun bölge yok."}
              </p>
              {zones.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilter("tum");
                  }}
                  className="text-xs font-bold text-cyan-300 hover:underline"
                >
                  Filtreleri temizle
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredZones.map((zone) => {
                const id = Number(zone.id);
                const checked = selectedSet.has(id);
                return (
                  <label
                    key={id}
                    className={`group flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition ${checked ? "border-cyan-400/40 bg-cyan-500/[0.09]" : "border-slate-700/80 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-800/60"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(id)}
                      disabled={notReady}
                      className="peer sr-only"
                    />
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${checked ? "border-cyan-400/25 bg-cyan-400/15 text-cyan-300" : "border-slate-700 bg-slate-800 text-slate-500"}`}
                    >
                      <FontAwesomeIcon icon={faTv} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-sm font-bold text-white"
                        title={zone.bolgeAdi}
                      >
                        {zone.bolgeAdi}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                        Matrix #{zone.matrixDeviceId} · Port {zone.portKodu}
                      </span>
                    </span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] transition ${checked ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-slate-600 bg-slate-900 text-transparent group-hover:border-cyan-500/40"}`}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {!loading && !error && hiddenIds.length > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
              <FontAwesomeIcon icon={faLock} className="mt-0.5 shrink-0" />
              <p>
                {hiddenIds.length} eski bölge ataması artık bu kullanıcının
                seçilebilir listesinde değil. Bunlar mevcut kayıtlarda korunur;
                normal kullanıcıya kapalı olan bölgeler kontrol panelinde
                görünmez. Buradan silinmezler.
              </p>
            </div>
          )}
        </main>

        <footer className="shrink-0 border-t border-slate-800 bg-slate-900/95 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {dirty ? (
                <span className="font-semibold text-amber-300">
                  Kaydedilmemiş değişiklikler var
                </span>
              ) : (
                <span>Değişiklik yapılmadı</span>
              )}
              {isAdminTarget && (
                <span className="ml-2 inline-flex items-center gap-1 text-violet-300">
                  <FontAwesomeIcon icon={faCircleInfo} /> Admin zaten tüm
                  bölgelere erişir.
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void closeWithCheck()}
                disabled={saving}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-40"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={notReady || !dirty}
                className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-cyan-500/10 transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FontAwesomeIcon
                  icon={saving ? faSpinner : faFloppyDisk}
                  spin={saving}
                />
                {saving ? "Kaydediliyor..." : "Yetkileri Kaydet"}
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default BolgeYetkiModal;
