import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGamepad,
  faSatelliteDish,
  faTv,
  faSpinner,
  faChevronRight,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";

import orchestrationService from "../../services/orchestrationService";
import KontrolPaneliKumandaModal from "./KontrolPaneliKumandaModal";

const KumandalarSidebar = ({ kullaniciId }) => {
  const [kumandalar, setKumandalar] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedKumanda, setSelectedKumanda] = useState(null);

  useEffect(() => {
    let iptalEdildi = false;

    const fetchKumandalar = async () => {
      try {
        setLoading(true);

        const data = await orchestrationService.getKontrolPaneliKumandalar();

        if (iptalEdildi) return;

        setKumandalar(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Kontrol paneli kumandaları yüklenemedi:", error);

        if (!iptalEdildi) {
          setKumandalar([]);
        }
      } finally {
        if (!iptalEdildi) {
          setLoading(false);
        }
      }
    };

    fetchKumandalar();

    return () => {
      iptalEdildi = true;
    };
  }, []);

  const getKumandaIcon = (cihazTipi) => {
    const cihazTipiLower = (cihazTipi || "").toLowerCase();

    if (
      cihazTipiLower.includes("uydu") ||
      cihazTipiLower.includes("receiver") ||
      cihazTipiLower.includes("decoder")
    ) {
      return faSatelliteDish;
    }

    if (
      cihazTipiLower.includes("tv") ||
      cihazTipiLower.includes("televizyon")
    ) {
      return faTv;
    }

    return faGamepad;
  };

  const handleKumandaOpen = (kumanda) => {
    setSelectedKumanda(kumanda);
  };

  const handleKumandaClose = () => {
    setSelectedKumanda(null);
  };

  return (
    <>
      <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-slate-700/70 bg-slate-950/95 shadow-2xl shadow-black/30">
        {/* HEADER */}
        <div className="relative overflow-hidden border-b border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_42%)]" />

          <div className="relative p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-400/10 text-blue-300 shadow-lg shadow-blue-500/10">
                <FontAwesomeIcon icon={faGamepad} />
              </div>

              <div>
                <h3 className="text-sm font-black text-white">Kumandalar</h3>

                <p className="mt-0.5 text-[10px] text-slate-500">
                  Kullanılabilir cihaz kumandaları
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LİSTE */}
        <div className="flex-1 space-y-2 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
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
                IR verici ile eşleşmiş aktif bir kumanda bulunmuyor.
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
                  onClick={() => handleKumandaOpen(kumanda)}
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
        onClose={handleKumandaClose}
      />
    </>
  );
};

export default KumandalarSidebar;
