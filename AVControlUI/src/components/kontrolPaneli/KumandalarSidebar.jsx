import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faChevronRight,
  faExclamationCircle,
  faGamepad,
  faMobileScreen,
  faSatelliteDish,
  faSpinner,
  faTv,
} from "@fortawesome/free-solid-svg-icons";

import orchestrationService from "../../services/orchestrationService";
import KontrolPaneliKumandaModal from "./KontrolPaneliKumandaModal";

const KumandalarSidebar = ({ kullaniciId }) => {
  const location = useLocation();
  const [kumandalar, setKumandalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKumanda, setSelectedKumanda] = useState(null);

  useEffect(() => {
    let iptalEdildi = false;

    const fetchKumandalar = async () => {
      try {
        const data = await orchestrationService.getKontrolPaneliKumandalar();
        if (!iptalEdildi) {
          setKumandalar(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Kontrol paneli kumandaları yüklenemedi:", error);
        if (!iptalEdildi) setKumandalar([]);
      } finally {
        if (!iptalEdildi) setLoading(false);
      }
    };

    void fetchKumandalar();
    return () => {
      iptalEdildi = true;
    };
  }, []);

  const getKumandaIcon = (cihazTipi) => {
    const tip = (cihazTipi || "").toLowerCase();
    if (
      tip.includes("uydu") ||
      tip.includes("receiver") ||
      tip.includes("decoder")
    ) {
      return faSatelliteDish;
    }
    if (tip.includes("tv") || tip.includes("televizyon")) return faTv;
    return faGamepad;
  };

  const gelismisAcik = location.pathname === "/gelismis-kumanda";

  return (
    <>
      <aside className="flex h-full w-full min-w-0 flex-col border-l border-slate-700/70 bg-slate-950/95 shadow-2xl shadow-black/30">
        {/* HEADER */}
        <div className="relative overflow-hidden border-b border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_42%)]" />
          <div className="relative p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-400/10 text-blue-300 shadow-lg shadow-blue-500/10">
                <FontAwesomeIcon icon={faGamepad} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white">Kumandalar</h3>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Kullanılabilir cihaz kumandaları
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MOBİL KUMANDAYA TEK DOKUNUŞLA GEÇİŞ */}
        <div className="border-b border-slate-800/80 px-3 py-3">
          <Link
            to="/gelismis-kumanda"
            aria-label="Gelişmiş Kumandayı Aç"
            className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-950/30 ${gelismisAcik ? "border-cyan-400/70 bg-cyan-500/20" : "border-cyan-400/35 bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-slate-900 hover:border-cyan-400/70 hover:from-cyan-500/25"}`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-500/15 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.13)]">
              <FontAwesomeIcon icon={faMobileScreen} className="text-lg" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-extrabold text-cyan-100">
                Gelişmiş Kumanda
              </span>
              <span className="mt-0.5 block text-[10px] leading-4 text-slate-400">
                Büyük tuşlarla mobil IR kontrol
              </span>
            </span>
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              className="shrink-0 text-xs text-cyan-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        {/* MEVCUT KUMANDA LİSTESİ */}
        <div className="flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent space-y-2 overflow-y-auto p-3">
          {loading ? (
            <div className="mt-10 flex flex-col items-center justify-center gap-3 text-slate-400">
              <FontAwesomeIcon
                icon={faSpinner}
                spin
                className="text-2xl text-blue-400"
              />
              <p className="text-xs">Kumandalar yükleniyor...</p>
            </div>
          ) : kumandalar.length === 0 ? (
            <div className="mx-1 mt-10 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-7 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-slate-400">
                <FontAwesomeIcon
                  icon={faExclamationCircle}
                  className="text-xl"
                />
              </div>
              <p className="text-sm font-bold text-slate-300">
                Kumanda bulunamadı
              </p>
              <p className="mt-1 text-xs text-slate-500">
                IR vericiyle eşleşmiş aktif bir kumanda bulunmuyor.
              </p>
            </div>
          ) : (
            kumandalar.map((kumanda) => {
              const icon = getKumandaIcon(kumanda.cihazTipi);
              const hedefSayisi = Array.isArray(kumanda.hedefler)
                ? kumanda.hedefler.length
                : 0;

              return (
                <button
                  key={kumanda.remoteControlId}
                  type="button"
                  onClick={() => setSelectedKumanda(kumanda)}
                  className="group relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-3 text-left transition-all duration-200 hover:border-blue-400/40 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-blue-950/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-blue-300 transition-all group-hover:border-blue-400/40 group-hover:bg-blue-500/10">
                      <FontAwesomeIcon icon={icon} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {kumanda.kumandaMarkaModel}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {kumanda.cihazTipi || "Cihaz tipi belirtilmemiş"}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        {kumanda.protokolTipi && (
                          <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-300">
                            {kumanda.protokolTipi}
                          </span>
                        )}
                        <span className="text-[9px] font-medium text-slate-500">
                          {hedefSayisi} IR hedefi
                        </span>
                      </div>
                    </div>
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="text-xs text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-blue-300"
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <KontrolPaneliKumandaModal
        isOpen={Boolean(selectedKumanda)}
        kumanda={selectedKumanda}
        kullaniciId={kullaniciId}
        onClose={() => setSelectedKumanda(null)}
      />
    </>
  );
};

export default KumandalarSidebar;
