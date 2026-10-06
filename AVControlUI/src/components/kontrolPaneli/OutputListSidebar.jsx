import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faServer } from "@fortawesome/free-solid-svg-icons";

const OutputListSidebar = ({
  outputs = [],
  matrices = [],
  selectedOutputs = [],
  onToggleSelect,
  onSelectOne,
}) => {
  // ================================================================
  // GÖRSEL URL
  // ================================================================

  const getImageUrl = (url) => {
    if (!url) {
      return null;
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL_API || "";

    const baseUrl = apiBaseUrl.replace("/api", "");

    return `${baseUrl}${url}`;
  };

  // ================================================================
  // JSX
  // ================================================================

  return (
    <div
      className="
        flex
        h-full
        min-h-0
        w-full
        min-w-0
        flex-col
        overflow-hidden
        bg-slate-950/40
      "
    >
      {/* ============================================================
          HEADER
      ============================================================ */}

      <div
        className="
          shrink-0
          border-b
          border-slate-800/60
          bg-gradient-to-b
          from-slate-950/80
          to-transparent
          p-3

          sm:p-4

          2xl:p-5
        "
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-cyan-500/20
              text-cyan-400
              shadow-inner

              sm:h-10
              sm:w-10
            "
          >
            <FontAwesomeIcon icon={faServer} />
          </div>

          <h2
            className="
              min-w-0
              truncate
              text-base
              font-extrabold
              text-white

              sm:text-lg

              2xl:text-xl
            "
          >
            Bölgeler
          </h2>
        </div>

        <p
          className="
            mt-2
            line-clamp-2
            text-[10px]
            font-medium
            leading-4
            tracking-wide
            text-slate-400

            sm:text-xs
          "
        >
          İşlem için seçin veya bölgeye tıklayın
        </p>
      </div>

      {/* ============================================================
          LİSTE
      ============================================================ */}

      <div
        className="
          min-h-0
          flex-1
          space-y-2
          overflow-y-auto
          overflow-x-hidden
          p-2

          sm:p-3

          2xl:p-4

          scrollbar-thin
          scrollbar-thumb-slate-700
          scrollbar-track-transparent
        "
      >
        {outputs.length === 0 ? (
          <div
            className="
              flex
              min-h-[180px]
              flex-col
              items-center
              justify-center
              rounded-2xl
              border
              border-dashed
              border-slate-700/60
              bg-slate-900/30
              px-4
              text-center
            "
          >
            <div
              className="
                mb-3
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-slate-800
                text-slate-500
              "
            >
              <FontAwesomeIcon icon={faServer} />
            </div>

            <p className="text-sm font-bold text-slate-400">Bölge bulunamadı</p>

            <p className="mt-1 text-[10px] text-slate-600">
              Sisteme tanımlı aktif bir bölge bulunmuyor.
            </p>
          </div>
        ) : (
          outputs.map((out) => {
            const matrix = matrices.find(
              (m) => String(m.id) === String(out.matrixDeviceId),
            );

            const isSelected = selectedOutputs.some((o) => o.id === out.id);

            const bgUrl = out.cihazGorselUrl
              ? getImageUrl(out.cihazGorselUrl)
              : null;

            return (
              <div
                key={out.id}
                className="
                  group
                  flex
                  min-w-0
                  items-center
                  gap-2
                "
              >
                {/* ==================================================
                    CHECKBOX
                ================================================== */}

                <div
                  className="
                    flex
                    shrink-0
                    items-center
                    justify-center

                    sm:pl-1
                  "
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(event) => {
                      event.stopPropagation();

                      onToggleSelect?.(out);
                    }}
                    className="
                      h-5
                      w-5
                      cursor-pointer
                      accent-cyan-500
                    "
                    title="Çoklu seçim"
                  />
                </div>

                {/* ==================================================
                    BÖLGE KARTI
                ================================================== */}

                <button
                  type="button"
                  onClick={() => onSelectOne?.(out)}
                  style={
                    bgUrl
                      ? {
                          backgroundImage: `url(${bgUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                  className={`
                    group
                    relative
                    min-w-0
                    flex-1
                    overflow-hidden
                    rounded-xl
                    border
                    p-3
                    text-left
                    transition-all
                    duration-300

                    sm:rounded-2xl
                    sm:p-3.5

                    2xl:p-4

                    ${
                      isSelected
                        ? "border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                        : "border-transparent hover:border-slate-600"
                    }

                    ${
                      !bgUrl
                        ? isSelected
                          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10"
                          : "bg-slate-800/30 hover:bg-slate-800/60"
                        : ""
                    }
                  `}
                >
                  {/* FOTOĞRAF OVERLAY */}
                  {bgUrl && (
                    <div
                      className={`
                        absolute
                        inset-0
                        transition-colors
                        duration-300

                        ${
                          isSelected
                            ? "bg-slate-950/70"
                            : "bg-slate-950/85 group-hover:bg-slate-950/75"
                        }
                      `}
                    />
                  )}

                  {/* SEÇİLİ SOL ÇİZGİ */}
                  {isSelected && (
                    <div
                      className="
                        absolute
                        bottom-0
                        left-0
                        top-0
                        z-20
                        w-1
                        bg-cyan-400
                        shadow-[0_0_10px_#22d3ee]

                        sm:w-1.5
                      "
                    />
                  )}

                  {/* KART İÇERİĞİ */}
                  <div
                    className={`
                      relative
                      z-10
                      flex
                      min-w-0
                      items-center
                      justify-between
                      gap-2

                      ${isSelected ? "pl-1.5" : ""}
                    `}
                  >
                    {/* SOL BİLGİ */}
                    <div className="min-w-0 flex-1">
                      <span
                        title={out.bolgeAdi}
                        className={`
                          block
                          truncate
                          text-[13px]
                          font-bold
                          transition-colors

                          sm:text-sm

                          ${
                            isSelected
                              ? "text-cyan-300"
                              : "text-slate-200 group-hover:text-white"
                          }
                        `}
                      >
                        {out.bolgeAdi}
                      </span>

                      <div
                        className={`
                          mt-1
                          flex
                          min-w-0
                          items-center
                          gap-1.5
                          font-mono
                          text-[9px]
                          tracking-wide

                          sm:text-[10px]

                          ${
                            isSelected
                              ? "text-cyan-200/80"
                              : "text-slate-400 group-hover:text-slate-300"
                          }
                        `}
                      >
                        <FontAwesomeIcon
                          icon={faServer}
                          className="
                            shrink-0
                            opacity-70
                          "
                        />

                        <span
                          className="min-w-0 truncate"
                          title={
                            matrix
                              ? `${matrix.cihazAdi} (Port: ${out.portKodu})`
                              : "Matrix Tanımsız"
                          }
                        >
                          {matrix
                            ? `${matrix.cihazAdi} • ${out.portKodu}`
                            : "Matrix Tanımsız"}
                        </span>
                      </div>
                    </div>

                    {/* SAĞ DURUM */}
                    <div
                      className="
                        flex
                        shrink-0
                        flex-col
                        items-center
                        justify-center
                      "
                      title={out.aktifMi ? "Aktif" : "Pasif"}
                    >
                      <div
                        className={`
                          h-2
                          w-2
                          rounded-full
                          transition-all

                          sm:h-2.5
                          sm:w-2.5

                          ${
                            out.aktifMi
                              ? "bg-emerald-500 shadow-[0_0_10px_#10b981]"
                              : "bg-red-500/60"
                          }
                        `}
                      />
                    </div>
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OutputListSidebar;
