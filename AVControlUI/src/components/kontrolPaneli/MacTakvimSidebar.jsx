import { useState, useEffect, memo, useCallback, useMemo, useRef } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faFutbol,
  faSync,
  faTv,
  faExclamationCircle,
  faCalendarDay,
  faClock,
  faCircle,
  faSignal,
} from "@fortawesome/free-solid-svg-icons";

import { toast } from "react-toastify";
import macTakvimService from "../../services/macTakvimService";

// ================================================================
// YARDIMCI METOTLAR
// ================================================================

// Maçkolik'ten gelen durum; bazen "MS", "İY", "1. Yarı" ya da
// maç başlamadan önce yalnızca "20:00" gibi saat bilgisi olabilir.
// Sadece 0-0 skoruna bakarak maçın başladığını varsaymıyoruz.
const normalizeDurum = (durum) =>
  String(durum ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i");

const getMacAsamasi = (durum) => {
  const value = normalizeDurum(durum);

  // Devre arası: ikinci yarı başlamadan önce "İY" skoru gösterilir.
  if (
    /^(iy|ht)(?:\s|$)/.test(value) ||
    value === "devre" ||
    value.includes("devre arasi") ||
    value.includes("ilk yari bitti") ||
    value.includes("half time") ||
    value.includes("half-time") ||
    value.includes("halftime")
  ) {
    return "halftime";
  }

  // Maç sonu, uzatmaların sonu veya penaltılar sonrası bitiş.
  if (
    /^(ms|ft|aet|pen)(?:\s|$)/.test(value) ||
    value.includes("maç sonu") ||
    value.includes("mac sonu") ||
    value.includes("bitti") ||
    value.includes("finished") ||
    value.includes("full time") ||
    value.includes("tamamlandi")
  ) {
    return "finished";
  }

  // Canlı maç, ilk/ikinci yarı ve dakika bilgileri.
  if (
    value.includes("canli") ||
    value.includes("live") ||
    value.includes("devam") ||
    value.includes("ilk yari") ||
    value.includes("ikinci yari") ||
    value.includes("1. yari") ||
    value.includes("2. yari") ||
    value.includes("1. devre") ||
    value.includes("2. devre") ||
    /^(1y|2y|1h|2h)$/.test(value)
  ) {
    return "live";
  }

  // Örnek: 12, 45', 45+2, 90+4'. "0" ve saat metinleri canlı sayılmaz.
  const minute = value.match(/^(\d{1,3})(?:\+\d{1,2})?['’]?(?:\s*dk)?$/);
  if (minute && Number(minute[1]) >= 1 && Number(minute[1]) <= 120) {
    return "live";
  }

  // Başlamadı/ertelendi/iptal veya bilinmeyen durumlarda skor göstermeyiz.
  return "scheduled";
};

const isLiveMatch = (durum) => {
  const asama = getMacAsamasi(durum);
  return asama === "live" || asama === "halftime";
};

const getStatusStyle = (durum) => {
  const asama = getMacAsamasi(durum);

  if (asama === "live") {
    return {
      card: "border-red-500/35 bg-gradient-to-br from-red-500/[0.08] via-slate-900/90 to-slate-950/90",
      badge: "bg-red-500/15 text-red-300 border-red-500/30",
      dot: "text-red-400 animate-pulse",
      accent: "bg-red-400",
    };
  }

  if (asama === "halftime") {
    return {
      card: "border-amber-500/30 bg-gradient-to-br from-amber-500/[0.06] via-slate-900/90 to-slate-950/90",
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      dot: "text-amber-400",
      accent: "bg-amber-400",
    };
  }

  if (asama === "finished") {
    return {
      card: "border-slate-700/70 bg-slate-900/80",
      badge: "bg-slate-700/60 text-slate-300 border-slate-600/70",
      dot: "text-slate-400",
      accent: "bg-slate-500",
    };
  }

  return {
    card: "border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.06] via-slate-900/90 to-slate-950/90",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    dot: "text-cyan-400",
    accent: "bg-cyan-400",
  };
};

// Skor metnini yalnızca güvenilir "sayı-sayı" formatında kabul et.
const parseSkor = (skor) => {
  const match = String(skor ?? "")
    .trim()
    .match(/^(\d+)\s*[-:]\s*(\d+)$/);

  return match ? `${Number(match[1])}-${Number(match[2])}` : null;
};

const getSkorGorunumu = (mac) => {
  const asama = getMacAsamasi(mac.durum);
  const skor = parseSkor(mac.skor);

  // API başlamamış maç için 0-0 döndürse bile "–" göster.
  if (asama === "scheduled" || !skor) {
    return { etiket: "", skor: "–", asama: "scheduled" };
  }

  if (asama === "halftime") {
    return { etiket: "İY", skor, asama };
  }

  if (asama === "finished") {
    return { etiket: "MS", skor, asama };
  }

  return { etiket: "", skor, asama: "live" };
};

const getDurumEtiketi = (durum) => {
  const asama = getMacAsamasi(durum);
  if (asama === "halftime") return "İY · Devre Arası";
  if (asama === "finished") return "MS";

  const raw = String(durum ?? "").trim();
  // Durum alanında "20:00" varsa bunu canlı maç gibi göstermeyelim.
  if (/^\d{1,2}:\d{2}$/.test(raw) || !raw) return "Başlamadı";
  return raw;
};

// Veritabanında maç tarihi sadece gün olarak kaydediliyorsa T00:00:00
// gerçek başlama saati değildir; saat bilgisini mümkünse durumdan göster.
const getMacSaati = (mac) => {
  const rawDurum = String(mac.durum ?? "").trim();
  if (/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(rawDurum)) {
    return rawDurum.padStart(5, "0");
  }

  const rawTarih = String(mac.macTarihi ?? "");
  if (
    /^\d{4}-\d{2}-\d{2}(?:T00:00(?::00(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(
      rawTarih,
    )
  ) {
    return "";
  }

  return formatTime(mac.macTarihi);
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
};

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const time = date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return time === "00:00" ? "" : time;
};

// Backend yayın kanallarını "Kanal A, Kanal B" biçiminde gönderebiliyor.
// Boşlukları temizle, tekrar edenleri kaldır ve her kanalı ayrı göster.
const getYayinKanallari = (value) => {
  if (!value) return [];

  const kanallar = Array.isArray(value)
    ? value
    : String(value).split(/[,;\n]+/);

  return [
    ...new Set(kanallar.map((kanal) => String(kanal).trim()).filter(Boolean)),
  ];
};

// ================================================================
// COMPONENT
// ================================================================

const MacTakvimSidebar = memo(() => {
  const [maclar, setMaclar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadingRef = useRef(false);

  // ==============================================================
  // GÜNÜN MAÇLARINI GETİR
  // ==============================================================

  const fetchGununMaclari = useCallback(async (silent = false) => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setRefreshing(true);

    try {
      const data = await macTakvimService.getGununMaclari();
      setMaclar(Array.isArray(data) ? data : []);
      setLoadError(false);
    } catch (error) {
      console.error("Günün maçları yüklenemedi:", error);
      setLoadError(true);

      // Yenileme hatasında önceki kayıtları koru.
      if (!silent) toast.error("Günün maçları yüklenemedi!");
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ==============================================================
  // İLK YÜKLEME + OTOMATİK YENİLEME
  // ==============================================================

  useEffect(() => {
    void fetchGununMaclari(false);

    // MySQL'deki güncel listeyi 30 saniyede bir oku.
    const intervalId = setInterval(() => {
      void fetchGununMaclari(true);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchGununMaclari]);

  const handleRefresh = () => {
    void fetchGununMaclari(false);
  };

  // ==============================================================
  // MAÇ SIRASI VE SAYAÇLAR
  // ==============================================================

  const siraliMaclar = useMemo(() => {
    return [...maclar].sort((a, b) => {
      const aLive = isLiveMatch(a.durum) ? 1 : 0;
      const bLive = isLiveMatch(b.durum) ? 1 : 0;

      if (aLive !== bLive) return bLive - aLive;

      return new Date(a.macTarihi || 0) - new Date(b.macTarihi || 0);
    });
  }, [maclar]);

  const canliMacSayisi = useMemo(() => {
    return maclar.filter((m) => isLiveMatch(m.durum)).length;
  }, [maclar]);

  const yayinliMacSayisi = useMemo(() => {
    return maclar.filter((m) => getYayinKanallari(m.yayinKanali).length > 0)
      .length;
  }, [maclar]);

  // ==============================================================
  // JSX
  // ==============================================================

  return (
    <aside className="flex h-full w-full min-w-0 flex-col border-l border-slate-700/70 bg-slate-950/95 shadow-2xl shadow-black/30">
      {/* HEADER */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_42%)]" />

        <div className="relative p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-sm font-black text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-500/10">
                  <FontAwesomeIcon icon={faFutbol} />
                </span>
                <span className="truncate">Günün Maçları</span>
              </h3>

              <p className="mt-0.5 ml-10 text-[10px] text-slate-500">
                Favori takımlar ve ligler
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Maç listesini yenile"
              aria-label="Maç listesini yenile"
              className="h-8 w-8 rounded-xl border border-slate-700 bg-slate-900 text-slate-400 transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300 disabled:opacity-60"
            >
              <FontAwesomeIcon icon={faSync} spin={refreshing} />
            </button>
          </div>

          {/* ÖZET */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 py-1.5">
              <div className="text-[9px] text-slate-500">Toplam</div>
              <div className="text-sm font-black text-white">
                {maclar.length}
              </div>
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-2.5 py-1.5">
              <div className="text-[9px] text-red-300/80">Canlı</div>
              <div className="text-sm font-black text-red-300">
                {canliMacSayisi}
              </div>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1.5">
              <div className="text-[9px] text-cyan-300/80">Yayın</div>
              <div className="text-sm font-black text-cyan-300">
                {yayinliMacSayisi}
              </div>
            </div>
          </div>

          {!loading && refreshing && (
            <p className="mt-2 text-[10px] text-cyan-400">
              Maç listesi güncelleniyor...
            </p>
          )}

          {!loading && loadError && !refreshing && (
            <p className="mt-2 text-[10px] text-amber-400">
              Güncel liste alınamadı.
              {maclar.length > 0
                ? " Önceki maçlar gösteriliyor."
                : " Yeniden deneyebilirsiniz."}
            </p>
          )}
        </div>
      </div>

      {/* LİSTE */}
      <div className="min-h-0 flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent space-y-2 overflow-y-auto p-2.5">
        {loading ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-300" />
            <p className="text-xs">Maçlar yükleniyor...</p>
          </div>
        ) : siraliMaclar.length === 0 ? (
          <div className="mx-2 mt-10 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-7 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-slate-400">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-xl" />
            </div>
            <p className="text-sm font-bold text-slate-300">
              {loadError ? "Maç listesi alınamadı." : "Favori maç bulunamadı."}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {loadError
                ? "Lütfen yeniden deneyin."
                : "Favori takım veya lig eklediğinde burada görünür."}
            </p>
          </div>
        ) : (
          siraliMaclar.map((m, index) => {
            const statusStyle = getStatusStyle(m.durum);
            const yayinKanallari = getYayinKanallari(m.yayinKanali);
            const saat = getMacSaati(m);
            const skorBilgisi = getSkorGorunumu(m);

            return (
              <article
                key={m.id ?? `${m.evSahibi}-${m.deplasman}-${index}`}
                className={`group relative overflow-hidden rounded-2xl border ${statusStyle.card} transition-all duration-200 hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-950/20`}
              >
                <span
                  className={`absolute top-0 left-0 h-full w-[3px] ${statusStyle.accent}`}
                />

                <div className="p-2.5 pl-3">
                  {/* ÜST SATIR */}
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-400">
                      <FontAwesomeIcon
                        icon={faSignal}
                        className="text-cyan-400/80"
                      />
                      <span
                        className="max-w-[145px] truncate"
                        title={m.ligAdi || ""}
                      >
                        {m.ligAdi || "Lig bilgisi yok"}
                      </span>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${statusStyle.badge}`}
                    >
                      <FontAwesomeIcon
                        icon={faCircle}
                        className={`text-[6px] ${statusStyle.dot}`}
                      />
                      {getDurumEtiketi(m.durum)}
                    </span>
                  </div>

                  {/* TAKIMLAR */}
                  <div className="flex items-center gap-2">
                    <span
                      className="min-w-0 flex-1 truncate text-left text-xs font-bold text-white"
                      title={m.evSahibi || ""}
                    >
                      {m.evSahibi || "-"}
                    </span>

                    {/* DURUMA GÖRE SKOR: – / CANLI / İY / MS */}
                    <span
                      aria-label={
                        skorBilgisi.etiket
                          ? `${skorBilgisi.etiket} ${skorBilgisi.skor}`
                          : skorBilgisi.skor === "–"
                            ? "Maç henüz başlamadı"
                            : `Canlı skor ${skorBilgisi.skor}`
                      }
                      className={`inline-flex min-w-[52px] shrink-0 items-center justify-center gap-1 rounded-lg border px-2 py-1 text-center text-[11px] font-black whitespace-nowrap ${skorBilgisi.asama === "live" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : skorBilgisi.asama === "halftime" ? "border-amber-500/25 bg-amber-500/10 text-amber-300" : skorBilgisi.asama === "finished" ? "border-slate-600 bg-slate-800/80 text-slate-200" : "border-slate-700 bg-slate-800/80 text-slate-400"}`}
                    >
                      {skorBilgisi.etiket && (
                        <span className="text-[9px] font-extrabold tracking-wide opacity-80">
                          {skorBilgisi.etiket}
                        </span>
                      )}
                      <span>{skorBilgisi.skor}</span>
                    </span>

                    <span
                      className="min-w-0 flex-1 truncate text-right text-xs font-bold text-white"
                      title={m.deplasman || ""}
                    >
                      {m.deplasman || "-"}
                    </span>
                  </div>

                  {/* TARİH VE SAAT */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <FontAwesomeIcon
                        icon={faCalendarDay}
                        className="text-cyan-400/80"
                      />
                      {formatDate(m.macTarihi)}
                    </span>

                    {saat && (
                      <span className="inline-flex items-center gap-1">
                        <FontAwesomeIcon
                          icon={faClock}
                          className="text-cyan-400/80"
                        />
                        {saat}
                      </span>
                    )}
                  </div>

                  {/* YAYIN KANALLARI — TAM GENİŞLİK, KESİLME YOK */}
                  {yayinKanallari.length > 0 ? (
                    <div className="mt-3 min-w-0 rounded-xl border border-cyan-400/20 bg-slate-950/65 p-2.5">
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-cyan-300">
                        <FontAwesomeIcon icon={faTv} />
                        <span>YAYIN KANALLARI</span>
                      </div>

                      <div className="flex min-w-0 flex-wrap gap-1.5">
                        {yayinKanallari.map((kanal, kanalIndex) => (
                          <span
                            key={`${kanal}-${kanalIndex}`}
                            title={kanal}
                            className="inline-flex max-w-full min-w-0 items-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1.5 text-[11px] leading-4 font-semibold [overflow-wrap:anywhere] break-words whitespace-normal text-cyan-100"
                          >
                            {kanal}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-800/70 pt-2 text-[10px] text-slate-500">
                      <FontAwesomeIcon icon={faTv} />
                      <span>Yayın bilgisi bulunmuyor</span>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </aside>
  );
});

MacTakvimSidebar.displayName = "MacTakvimSidebar";

export default MacTakvimSidebar;
