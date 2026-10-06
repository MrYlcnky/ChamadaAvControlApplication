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

const isLiveMatch = (durum) => {
  if (!durum) return false;

  const value = durum.toString().toLowerCase();

  return (
    value.includes("canlı") ||
    value.includes("live") ||
    value.includes("devam") ||
    value.includes("ilk yarı") ||
    value.includes("ikinci yarı") ||
    value.includes("1.") ||
    value.includes("2.")
  );
};

const isFinishedMatch = (durum) => {
  if (!durum) return false;

  const value = durum.toString().toLowerCase();

  return (
    value.includes("ms") ||
    value.includes("bitti") ||
    value.includes("finished") ||
    value.includes("tamamlandı")
  );
};

const getStatusStyle = (durum) => {
  if (isLiveMatch(durum)) {
    return {
      card: "border-red-500/35 bg-gradient-to-br from-red-500/[0.08] via-slate-900/90 to-slate-950/90",
      badge: "bg-red-500/15 text-red-300 border-red-500/30",
      dot: "text-red-400 animate-pulse",
      accent: "bg-red-400",
    };
  }

  if (isFinishedMatch(durum)) {
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

const MacTakvimSidebar = memo(() => {
  const [maclar, setMaclar] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadingRef = useRef(false);

  const fetchGununMaclari = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const data = await macTakvimService.getGununMaclari();
      setMaclar(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Maçlar yüklenemedi!");
      setMaclar([]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGununMaclari();
  }, [fetchGununMaclari]);

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
    return maclar.filter((m) => m.yayinKanali && m.yayinKanali.trim() !== "")
      .length;
  }, [maclar]);

  return (
    <aside className="w-[320px] h-full flex flex-col border-l border-slate-700/70 bg-slate-950/95 shadow-2xl shadow-black/30">
      {/* HEADER */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_42%)]" />

        <div className="relative p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-sm font-black text-white">
                <span className="w-8 h-8 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                  <FontAwesomeIcon icon={faFutbol} />
                </span>

                <span className="truncate">Günün Maçları</span>
              </h3>

              <p className="ml-10 mt-0.5 text-[10px] text-slate-500">
                Favori takımlar ve ligler
              </p>
            </div>

            <button
              onClick={fetchGununMaclari}
              disabled={loading}
              title="Yenile"
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:opacity-60 transition-all"
            >
              <FontAwesomeIcon icon={faSync} spin={loading} />
            </button>
          </div>

          {/* ÖZET */}
          <div className="grid grid-cols-3 gap-2 mt-3">
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
        </div>
      </div>

      {/* LİSTE */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {loading ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-9 h-9 rounded-full border-2 border-cyan-500/20 border-t-cyan-300 animate-spin" />
            <p className="text-xs">Maçlar yükleniyor...</p>
          </div>
        ) : siraliMaclar.length === 0 ? (
          <div className="mt-10 mx-2 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-7 text-center">
            <div className="mx-auto mb-3 w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-xl" />
            </div>

            <p className="text-sm font-bold text-slate-300">
              Favori maç bulunamadı.
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Favori takım veya lig eklediğinde burada görünür.
            </p>
          </div>
        ) : (
          siraliMaclar.map((m, index) => {
            const statusStyle = getStatusStyle(m.durum);
            const yayinVar = m.yayinKanali && m.yayinKanali.trim() !== "";
            const saat = formatTime(m.macTarihi);
            const skorVar = m.skor && m.skor.trim() !== "";

            return (
              <article
                key={m.id ?? `${m.evSahibi}-${m.deplasman}-${index}`}
                className={`group relative overflow-hidden rounded-2xl border ${statusStyle.card} hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-950/20 transition-all duration-200`}
              >
                <span
                  className={`absolute left-0 top-0 h-full w-[3px] ${statusStyle.accent}`}
                />

                <div className="p-2.5 pl-3">
                  {/* ÜST SATIR */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <FontAwesomeIcon
                        icon={faSignal}
                        className="text-cyan-400/80"
                      />
                      <span className="truncate max-w-[145px]">
                        {m.ligAdi || "Lig bilgisi yok"}
                      </span>
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${statusStyle.badge}`}
                    >
                      <FontAwesomeIcon
                        icon={faCircle}
                        className={`text-[6px] ${statusStyle.dot}`}
                      />
                      {m.durum || "Bekliyor"}
                    </span>
                  </div>

                  {/* TAKIMLAR */}
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 text-left text-xs font-bold text-white truncate">
                      {m.evSahibi || "-"}
                    </span>

                    <span
                      className={`shrink-0 min-w-[48px] rounded-lg border px-2 py-1 text-center text-[11px] font-black ${
                        skorVar
                          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                          : "bg-slate-800/80 border-slate-700 text-slate-400"
                      }`}
                    >
                      {skorVar ? m.skor : "VS"}
                    </span>

                    <span className="min-w-0 flex-1 text-right text-xs font-bold text-white truncate">
                      {m.deplasman || "-"}
                    </span>
                  </div>

                  {/* ALT SATIR */}
                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                    <div className="flex items-center gap-2 text-slate-500">
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

                    {yayinVar ? (
                      <span className="max-w-[110px] inline-flex items-center gap-1 rounded-lg bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 text-cyan-300 truncate">
                        <FontAwesomeIcon icon={faTv} className="shrink-0" />
                        <span className="truncate">{m.yayinKanali}</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">Yayın yok</span>
                    )}
                  </div>
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
