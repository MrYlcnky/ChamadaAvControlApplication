import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faServer } from "@fortawesome/free-solid-svg-icons";

const OutputListSidebar = ({
  outputs,
  matrices,
  selectedOutputs,
  onToggleSelect,
  onSelectOne,
}) => {
  // Resim URL'ini getiren yardımcı fonksiyon
  const getImageUrl = (url) => {
    if (!url) return null;
    const baseUrl = import.meta.env.VITE_API_BASE_URL_API.replace("/api", "");
    return `${baseUrl}${url}`;
  };

  return (
    <div className="w-1/4 flex flex-col border-r border-slate-700/60 bg-slate-950/40 z-10">
      {/* Başlık Alanı */}
      <div className="bg-gradient-to-b from-slate-950/80 to-transparent p-6 border-b border-slate-800/60">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 shadow-inner">
            <FontAwesomeIcon icon={faServer} />
          </div>
          Bölgeler
        </h2>
        <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide">
          İşlem için seçin veya tıklayın
        </p>
      </div>

      {/* Liste Alanı */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
        {outputs.map((out) => {
          const matrix = matrices.find((m) => m.id === out.matrixDeviceId);
          // Seçili mi? (selectedOutputs dizisinde var mı?)
          const isSelected = selectedOutputs.some((o) => o.id === out.id);
          const bgUrl = out.cihazGorselUrl
            ? getImageUrl(out.cihazGorselUrl)
            : null;

          return (
            <div
              key={out.id}
              className="relative flex items-center gap-2 group"
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation(); // Butonun tıklanmasını engelle
                  onToggleSelect(out);
                }}
                className="w-5 h-5 accent-cyan-500 cursor-pointer z-20 ml-2"
              />

              {/* Bölge Butonu */}
              <button
                onClick={() => onSelectOne(out)}
                style={
                  bgUrl
                    ? {
                        backgroundImage: `url(${bgUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
                }
                className={`w-full group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden ${
                  isSelected
                    ? "border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                    : "border-transparent hover:border-slate-600"
                } ${!bgUrl ? (isSelected ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10" : "bg-slate-800/30 hover:bg-slate-800/60") : ""}`}
              >
                {bgUrl && (
                  <div
                    className={`absolute inset-0 transition-colors duration-300 ${isSelected ? "bg-slate-950/70" : "bg-slate-950/85 group-hover:bg-slate-950/75"}`}
                  ></div>
                )}

                {/* Seçili ise sol tarafta parlayan çizgi */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee] z-20"></div>
                )}

                <div
                  className={`relative z-10 w-full flex items-center justify-between ${isSelected ? "pl-2" : ""}`}
                >
                  <div>
                    <span
                      className={`block font-bold text-[15px] mb-1 transition-colors ${isSelected ? "text-cyan-300" : "text-slate-200 group-hover:text-white"}`}
                    >
                      {out.bolgeAdi}
                    </span>
                    <span
                      className={`block text-[10px] font-mono tracking-wider ${isSelected ? "text-cyan-200/80" : "text-slate-400 group-hover:text-slate-300"}`}
                    >
                      <FontAwesomeIcon
                        icon={faServer}
                        className="mr-1.5 opacity-70"
                      />
                      {matrix
                        ? `${matrix.cihazAdi} (Port: ${out.portKodu})`
                        : "Matrix Tanımsız"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-1">
                    <div
                      className={`h-2.5 w-2.5 rounded-full transition-all ${out.aktifMi ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-red-500/50"}`}
                    ></div>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OutputListSidebar;
