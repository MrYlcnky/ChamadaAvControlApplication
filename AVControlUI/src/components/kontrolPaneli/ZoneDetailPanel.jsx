import { useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faPowerOff,
  faVolumeUp,
  faVolumeDown,
  faVolumeXmark,
  faSignal,
  faVideo,
  faSatelliteDish,
  faCirclePlay,
  faTv,
  faSpinner,
  faServer,
  faChevronDown,
  faCheck,
  faMagnifyingGlass,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";

// ================================================================
// LOADING OVERLAY
// ================================================================

const LoadingOverlay = () => (
  <div
    className="
      absolute
      inset-0
      z-50
      flex
      flex-col
      items-center
      justify-center
      rounded-2xl
      bg-slate-950/70
      px-4
      text-center
      backdrop-blur-sm

      sm:rounded-3xl
    "
  >
    <div
      className="
        flex
        h-14
        w-14
        items-center
        justify-center
        rounded-2xl
        border
        border-cyan-500/20
        bg-slate-900
        shadow-2xl

        sm:h-16
        sm:w-16

        2xl:h-20
        2xl:w-20
        2xl:rounded-3xl
      "
    >
      <FontAwesomeIcon
        icon={faSpinner}
        spin
        className="text-2xl text-cyan-400 sm:text-3xl 2xl:text-4xl"
      />
    </div>

    <p
      className="
        mt-3
        text-[10px]
        font-bold
        tracking-[0.14em]
        text-cyan-300
        animate-pulse

        sm:text-xs
        sm:tracking-widest

        2xl:mt-4
      "
    >
      SİNYAL GÖNDERİLİYOR...
    </p>
  </div>
);

// ================================================================
// COMPONENT
// ================================================================

const ZoneDetailPanel = ({
  selectedOutput = null,
  selectedOutputs = null,
  activeInputId,
  inputs = [],
  channels = [],
  actionLoading,
  onSourceChange,
  onBulkSourceChange,
  onChannelChange,
  onTvControl,
  onLedModeChange,
}) => {
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [localActiveInputId, setLocalActiveInputId] = useState(
    activeInputId ?? null,
  );

  const dropdownRef = useRef(null);

  // ================================================================
  // SEÇİMLER
  // ================================================================

  const selectedOutputList = Array.isArray(selectedOutputs)
    ? selectedOutputs
    : selectedOutput
      ? [selectedOutput]
      : [];

  const isMultiple = selectedOutputList.length > 1;

  const singleOutput =
    selectedOutputList.length === 1 ? selectedOutputList[0] : null;

  const firstMatrixDeviceId = selectedOutputList[0]?.matrixDeviceId;

  const isMixedMatrixSelection =
    isMultiple &&
    selectedOutputList.some(
      (output) => String(output.matrixDeviceId) !== String(firstMatrixDeviceId),
    );

  const bulkAvailableInputs =
    isMultiple && !isMixedMatrixSelection
      ? inputs.filter(
          (input) =>
            String(input.matrixDeviceId) === String(firstMatrixDeviceId),
        )
      : [];

  const hasActiveInput =
    localActiveInputId !== null && localActiveInputId !== undefined;

  // ================================================================
  // ACTIVE INPUT SENKRON
  // ================================================================

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalActiveInputId(activeInputId ?? null);
  }, [activeInputId]);

  // ================================================================
  // DROPDOWN DIŞINA TIKLAMA
  // ================================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSourceDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ================================================================
  // ARAMAYI SIFIRLA
  // ================================================================

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchQuery("");
  }, [singleOutput?.id, localActiveInputId]);

  // ================================================================
  // ROL
  // ================================================================

  const rawRol = localStorage.getItem("rol");

  const safeRol = rawRol ? String(rawRol).toLowerCase() : "";

  const isAdmin = safeRol === "1" || safeRol === "admin";

  // ================================================================
  // AKTİF INPUT
  // ================================================================

  const activeInputDetails = inputs.find(
    (input) => String(input.id) === String(localActiveInputId),
  );

  const availableInputs = singleOutput
    ? inputs.filter(
        (input) =>
          String(input.matrixDeviceId) === String(singleOutput.matrixDeviceId),
      )
    : [];

  // ================================================================
  // KANAL FİLTRE
  // ================================================================

  const filteredChannels = channels.filter((channel) => {
    if (String(channel.inputSourceId) !== String(localActiveInputId)) {
      return false;
    }

    const loweredSearch = searchQuery.toLocaleLowerCase("tr-TR");

    const matchesSearch =
      (channel.kanalAdi?.toLocaleLowerCase("tr-TR") || "").includes(
        loweredSearch,
      ) || (channel.kanalNumarasi?.toString() || "").includes(searchQuery);

    if (!channel.aktifMi) {
      return false;
    }

    if (isAdmin) {
      return matchesSearch;
    }

    return matchesSearch && channel.kullanicidaGosterilsinMi;
  });

  // ================================================================
  // TEKLİ KAYNAK DEĞİŞİMİ
  // ================================================================

  const handleSourceSelect = async (inputId) => {
    if (String(localActiveInputId) === String(inputId)) {
      setIsSourceDropdownOpen(false);
      return;
    }

    const previousInputId = localActiveInputId;

    setLocalActiveInputId(inputId);
    setSearchQuery("");
    setIsSourceDropdownOpen(false);

    try {
      await onSourceChange?.(inputId);
    } catch (error) {
      setLocalActiveInputId(previousInputId);

      console.error("Kaynak değiştirme hatası:", error);
    }
  };

  // ================================================================
  // ÇOKLU KAYNAK DEĞİŞİMİ
  // ================================================================

  const handleBulkSourceSelect = async (inputId) => {
    const previousInputId = localActiveInputId;

    setLocalActiveInputId(inputId);

    try {
      await onBulkSourceChange?.(inputId);
    } catch (error) {
      setLocalActiveInputId(previousInputId);

      console.error("Toplu kaynak değiştirme hatası:", error);
    }
  };

  // ================================================================
  // 1. DURUM: BÖLGE SEÇİLMEDİ
  // ================================================================

  if (selectedOutputList.length === 0) {
    return (
      <div
        className="
          flex
          h-full
          min-h-0
          w-full
          min-w-0
          flex-col
          items-center
          justify-center
          bg-transparent
          px-4
          py-8
          text-center
          text-slate-500

          sm:px-6
        "
      >
        <div
          className="
            mb-4
            flex
            h-20
            w-20
            items-center
            justify-center
            rounded-full
            border
            border-slate-700/50
            bg-slate-800/30
            shadow-inner

            sm:h-24
            sm:w-24

            2xl:mb-6
            2xl:h-28
            2xl:w-28
          "
        >
          <FontAwesomeIcon
            icon={faSignal}
            className="
              text-3xl
              text-cyan-500
              opacity-40

              sm:text-4xl

              2xl:text-5xl
            "
          />
        </div>

        <p
          className="
            text-lg
            font-bold
            text-slate-400

            sm:text-xl

            2xl:text-2xl
          "
        >
          Bölge Seçilmedi
        </p>

        <p
          className="
            mt-2
            max-w-md
            text-xs
            leading-5
            opacity-60

            sm:text-sm
          "
        >
          Kontrol etmek için bölgeler bölümünden bir veya birden fazla ekran
          seçin.
        </p>
      </div>
    );
  }

  // ================================================================
  // 2. DURUM: ÇOKLU SEÇİM
  // ================================================================

  if (isMultiple) {
    return (
      <div
        className="
          relative
          flex
          h-full
          min-h-0
          w-full
          min-w-0
          flex-col
          bg-transparent
        "
      >
        {actionLoading && <LoadingOverlay />}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overflow-x-hidden
            p-3

            sm:p-4

            2xl:p-6

            scrollbar-thin
            scrollbar-thumb-slate-700
          "
        >
          {/* ========================================================
              ÇOKLU SEÇİM HEADER
          ======================================================== */}

          <div
            className="
              mb-5
              rounded-2xl
              border
              border-slate-800/50
              bg-slate-950/30
              p-4

              sm:p-5

              2xl:mb-6
              2xl:rounded-3xl
              2xl:p-6
            "
          >
            <div
              className="
                flex
                flex-col
                gap-4

                sm:flex-row
                sm:items-start
                sm:justify-between
              "
            >
              <div className="min-w-0">
                <h2
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-2
                    bg-gradient-to-r
                    from-white
                    to-slate-400
                    bg-clip-text
                    text-xl
                    font-black
                    text-transparent

                    sm:text-2xl

                    2xl:text-3xl
                  "
                >
                  <FontAwesomeIcon
                    icon={faLayerGroup}
                    className="shrink-0 text-cyan-500"
                  />

                  <span className="truncate">
                    {selectedOutputList.length} Bölge Seçildi
                  </span>
                </h2>

                <p
                  className="
                    mt-2
                    text-xs
                    leading-5
                    text-slate-400

                    sm:text-sm
                  "
                >
                  Seçilen bölgelere aynı yayın kaynağını veya kanalı
                  gönderebilirsiniz.
                </p>
              </div>

              <div
                className="
                  hidden
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-cyan-500/20
                  bg-cyan-500/10
                  text-cyan-400
                  shadow-inner

                  2xl:flex
                "
              >
                <FontAwesomeIcon icon={faVideo} className="text-2xl" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
              {selectedOutputList.map((output) => (
                <span
                  key={output.id}
                  className="
                      max-w-full
                      truncate
                      rounded-full
                      border
                      border-slate-700/70
                      bg-slate-900/80
                      px-2.5
                      py-1
                      text-[10px]
                      font-bold
                      text-slate-300

                      sm:px-3
                      sm:text-xs
                    "
                >
                  {output.bolgeAdi}
                </span>
              ))}
            </div>
          </div>

          {/* ========================================================
              FARKLI MATRIX
          ======================================================== */}

          {isMixedMatrixSelection ? (
            <div
              className="
                flex
                min-h-[260px]
                flex-col
                items-center
                justify-center
                rounded-2xl
                border
                border-dashed
                border-slate-700/50
                bg-slate-900/20
                p-5
                text-center

                sm:p-8

                2xl:rounded-[2rem]
              "
            >
              <div
                className="
                  mb-4
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-red-500/20
                  bg-red-500/10
                "
              >
                <FontAwesomeIcon
                  icon={faSignal}
                  className="text-xl text-red-400"
                />
              </div>

              <p className="text-sm font-bold text-slate-300 sm:text-[15px]">
                Farklı Matrix Cihazlarına Ait Bölgeler Seçildi
              </p>

              <p className="mt-2 max-w-xl text-xs font-medium leading-5 text-slate-500">
                Toplu kaynak değişimi yapabilmek için aynı matrix cihazına bağlı
                bölgeleri birlikte seçmelisiniz.
              </p>
            </div>
          ) : (
            <>
              {/* ====================================================
                  TOPLU KAYNAK
              ==================================================== */}

              <div className="mb-4 flex items-center gap-3 border-b border-slate-800/50 pb-4">
                <div
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-cyan-500/20
                    text-cyan-400
                  "
                >
                  <FontAwesomeIcon icon={faSatelliteDish} />
                </div>

                <h3 className="text-sm font-bold text-slate-200">
                  Toplu Kaynak Değiştir
                </h3>
              </div>

              <div
                className="
                  grid
                  grid-cols-1
                  gap-2.5

                  min-[420px]:grid-cols-2

                  sm:gap-3

                  2xl:grid-cols-3
                "
              >
                {bulkAvailableInputs.map((input) => {
                  const isBulkSelected =
                    String(localActiveInputId) === String(input.id);

                  return (
                    <button
                      type="button"
                      key={input.id}
                      onClick={() => handleBulkSourceSelect(input.id)}
                      className={`
                          group
                          relative
                          flex
                          min-w-0
                          flex-col
                          items-center
                          justify-center
                          overflow-hidden
                          rounded-2xl
                          border
                          bg-gradient-to-b
                          p-3
                          transition-all
                          duration-300

                          sm:p-4

                          ${
                            isBulkSelected
                              ? "from-cyan-500/20 to-slate-900/90 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.20)]"
                              : "from-slate-800/80 to-slate-900/90 border-slate-700/50 hover:border-cyan-500/50 hover:from-slate-700 hover:to-slate-800"
                          }
                        `}
                    >
                      <div
                        className={`
                            mb-3
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-xl
                            border
                            transition-all

                            ${
                              isBulkSelected
                                ? "border-cyan-300 bg-cyan-500 text-white"
                                : "border-cyan-500/20 bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white"
                            }
                          `}
                      >
                        <FontAwesomeIcon icon={faVideo} className="text-lg" />
                      </div>

                      <span className="w-full truncate text-center text-xs font-bold text-slate-200 group-hover:text-white sm:text-sm">
                        {input.inputName}
                      </span>

                      <span
                        className="
                            mt-2
                            max-w-full
                            truncate
                            rounded-full
                            border
                            border-slate-800/80
                            bg-slate-950/50
                            px-2
                            py-0.5
                            font-mono
                            text-[9px]
                            font-semibold
                            text-slate-400
                          "
                      >
                        Port: {input.portNumarasi}
                      </span>

                      {isBulkSelected && (
                        <div
                          className="
                              absolute
                              right-2
                              top-2
                              flex
                              h-6
                              w-6
                              items-center
                              justify-center
                              rounded-full
                              bg-cyan-500
                              text-white
                              shadow-lg
                            "
                        >
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="text-[9px]"
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ====================================================
                  TOPLU KANAL
              ==================================================== */}

              {hasActiveInput && (
                <div className="mt-6 flex flex-col animate-fade-in-up">
                  <ChannelHeader
                    title="Toplu Kanal Değiştir"
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                  />

                  <ChannelGrid
                    channels={filteredChannels}
                    onChannelChange={onChannelChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ================================================================
  // 3. DURUM: TEKLİ SEÇİM
  // ================================================================

  return (
    <div
      className="
        relative
        flex
        h-full
        min-h-0
        w-full
        min-w-0
        flex-col
        bg-transparent
      "
    >
      {actionLoading && <LoadingOverlay />}

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
          p-3

          sm:p-4

          2xl:p-6

          scrollbar-thin
          scrollbar-thumb-slate-700
        "
      >
        {/* ==========================================================
            ÜST KARTLAR
        ========================================================== */}

        <div
          className="
            mb-5
            grid
            min-w-0
            grid-cols-1
            gap-3

            2xl:grid-cols-2
            2xl:gap-5
          "
        >
          {/* ========================================================
              SOL KART
          ======================================================== */}

          <div
            className="
              min-w-0
              rounded-2xl
              border
              border-slate-800/50
              bg-slate-950/30
              p-4

              sm:p-5

              2xl:rounded-3xl
            "
          >
            <div className="min-w-0">
              <h1
                title={singleOutput.bolgeAdi}
                className="
                  truncate
                  bg-gradient-to-r
                  from-white
                  to-slate-400
                  bg-clip-text
                  text-2xl
                  font-black
                  text-transparent

                  sm:text-3xl

                  2xl:text-4xl
                "
              >
                {singleOutput.bolgeAdi}
              </h1>

              {/* NOVASTAR */}
              {singleOutput.viplexKontroluVarMi && (
                <div className="mt-4 border-t border-slate-800/50 pt-3 animate-fade-in-up">
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-500 sm:text-[10px]">
                    Ekran Modu
                  </p>

                  <div
                    className="
                      grid
                      grid-cols-1
                      gap-2

                      min-[400px]:grid-cols-2
                    "
                  >
                    <button
                      type="button"
                      onClick={() => onLedModeChange?.(1)}
                      className="
                        flex
                        min-w-0
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-purple-500/20
                        bg-purple-500/10
                        px-3
                        py-2.5
                        text-[10px]
                        font-bold
                        text-purple-400
                        transition-all

                        hover:bg-purple-500
                        hover:text-white

                        sm:text-xs
                      "
                    >
                      <FontAwesomeIcon
                        icon={faCirclePlay}
                        className="mr-2 shrink-0"
                      />

                      <span className="truncate">Reklam Modu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onLedModeChange?.(2)}
                      className="
                        flex
                        min-w-0
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-emerald-500/20
                        bg-emerald-500/10
                        px-3
                        py-2.5
                        text-[10px]
                        font-bold
                        text-emerald-400
                        transition-all

                        hover:bg-emerald-500
                        hover:text-white

                        sm:text-xs
                      "
                    >
                      <FontAwesomeIcon icon={faTv} className="mr-2 shrink-0" />

                      <span className="truncate">Tam Ekran</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TV KONTROL */}
            {singleOutput.remoteControlId ? (
              <div
                className="
                  mt-4
                  flex
                  w-fit
                  max-w-full
                  flex-wrap
                  items-center
                  gap-1
                  rounded-2xl
                  border
                  border-slate-700/50
                  bg-slate-900
                  p-1.5
                  shadow-lg

                  sm:mt-5
                "
              >
                <button
                  type="button"
                  onClick={() => onTvControl?.("POWER")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition hover:bg-red-500 hover:text-white sm:h-11 sm:w-11"
                  title="Kapat/Aç"
                >
                  <FontAwesomeIcon icon={faPowerOff} />
                </button>

                <div className="mx-1 hidden h-6 w-px bg-slate-800 min-[380px]:block" />

                <button
                  type="button"
                  onClick={() => onTvControl?.("VOL_DOWN")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/50 text-slate-300 transition hover:bg-slate-700 sm:h-11 sm:w-11"
                  title="Sesi Kıs"
                >
                  <FontAwesomeIcon icon={faVolumeDown} />
                </button>

                <button
                  type="button"
                  onClick={() => onTvControl?.("MUTE")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/50 text-slate-300 transition hover:bg-slate-700 sm:h-11 sm:w-11"
                  title="Sessiz"
                >
                  <FontAwesomeIcon icon={faVolumeXmark} />
                </button>

                <button
                  type="button"
                  onClick={() => onTvControl?.("VOL_UP")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/50 text-slate-300 transition hover:bg-slate-700 sm:h-11 sm:w-11"
                  title="Sesi Aç"
                >
                  <FontAwesomeIcon icon={faVolumeUp} />
                </button>
              </div>
            ) : (
              <div className="mt-4" />
            )}
          </div>

          {/* ========================================================
              CANLI YAYIN KAYNAĞI
          ======================================================== */}

          <div
            className="
              relative
              z-30
              min-w-0
            "
            ref={dropdownRef}
          >
            <button
              type="button"
              onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
              className={`
                group
                relative
                flex
                w-full
                min-w-0
                flex-col
                overflow-hidden
                rounded-2xl
                border
                bg-gradient-to-br
                from-slate-900
                to-slate-950
                p-1
                text-left
                transition-all
                duration-300

                2xl:rounded-3xl

                ${
                  isSourceDropdownOpen
                    ? "border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.25)]"
                    : "border-cyan-500/30 hover:border-cyan-400/70"
                }
              `}
            >
              <div className="absolute bottom-0 left-0 top-0 w-1 bg-cyan-400 shadow-[0_0_20px_#22d3ee]" />

              <div
                className="
                  flex
                  min-w-0
                  flex-1
                  flex-col
                  justify-center
                  rounded-xl
                  bg-slate-900/50
                  p-3
                  backdrop-blur-xl

                  sm:p-4

                  2xl:rounded-[1.3rem]
                  2xl:p-5
                "
              >
                <p
                  className="
                    mb-3
                    truncate
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.12em]
                    text-cyan-400/80

                    sm:text-[10px]

                    2xl:text-[11px]
                    2xl:tracking-[0.2em]
                  "
                >
                  Canlı Yayın Kaynağı
                </p>

                <div className="flex min-w-0 items-center justify-between gap-2">
                  {activeInputDetails ? (
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          border
                          border-cyan-500/20
                          bg-cyan-500/10
                          text-cyan-400
                          shadow-inner

                          sm:h-12
                          sm:w-12

                          2xl:h-14
                          2xl:w-14
                        "
                      >
                        <FontAwesomeIcon
                          icon={faCirclePlay}
                          className="text-xl animate-pulse sm:text-2xl"
                        />
                      </div>

                      <div className="min-w-0">
                        <h2
                          title={activeInputDetails.inputName}
                          className="
                            truncate
                            text-lg
                            font-extrabold
                            tracking-tight
                            text-white

                            sm:text-xl

                            2xl:text-2xl
                          "
                        >
                          {activeInputDetails.inputName}
                        </h2>

                        <p
                          className="
                            mt-1
                            flex
                            min-w-0
                            items-center
                            gap-1.5
                            font-mono
                            text-[9px]
                            text-cyan-400/60

                            sm:text-[10px]
                          "
                        >
                          <FontAwesomeIcon
                            icon={faServer}
                            className="shrink-0"
                          />

                          <span className="truncate">
                            Port: {activeInputDetails.portNumarasi}
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-w-0 items-center gap-3 opacity-60">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-500">
                        <FontAwesomeIcon icon={faTv} className="text-xl" />
                      </div>

                      <h2 className="truncate text-base font-bold text-slate-400">
                        Yayın Yok
                      </h2>
                    </div>
                  )}

                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`
                      shrink-0
                      text-lg
                      transition-transform
                      duration-300

                      ${
                        isSourceDropdownOpen
                          ? "rotate-180 text-cyan-400"
                          : "text-slate-600 group-hover:text-cyan-300"
                      }
                    `}
                  />
                </div>
              </div>
            </button>

            {/* DROPDOWN */}
            {isSourceDropdownOpen && (
              <div
                className="
                  absolute
                  left-0
                  top-[calc(100%+8px)]
                  z-50
                  flex
                  w-full
                  min-w-0
                  flex-col
                  overflow-hidden
                  rounded-2xl
                  border
                  border-cyan-500/40
                  bg-slate-900/95
                  p-2
                  shadow-[0_20px_50px_rgba(0,0,0,0.7)]
                  backdrop-blur-2xl
                  animate-fade-in-up

                  sm:p-3
                "
              >
                <p className="mb-2 border-b border-slate-800/80 px-2 py-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:px-3 sm:text-[10px]">
                  Geçiş Yapılacak Kaynak
                </p>

                <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                  {availableInputs.map((input) => {
                    const isActive =
                      String(localActiveInputId) === String(input.id);

                    return (
                      <button
                        type="button"
                        key={input.id}
                        onClick={() => handleSourceSelect(input.id)}
                        disabled={isActive}
                        className={`
                            flex
                            w-full
                            min-w-0
                            items-center
                            justify-between
                            gap-2
                            rounded-xl
                            border
                            p-2.5
                            transition-all

                            ${
                              isActive
                                ? "border-cyan-500/30 bg-cyan-500/10"
                                : "border-transparent bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800"
                            }
                          `}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div
                            className={`
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg

                                ${
                                  isActive
                                    ? "bg-cyan-500/20 text-cyan-400"
                                    : "bg-slate-800 text-slate-400"
                                }
                              `}
                          >
                            <FontAwesomeIcon icon={faVideo} />
                          </div>

                          <div className="min-w-0 text-left">
                            <p
                              className={`
                                  truncate
                                  text-xs
                                  font-bold

                                  ${
                                    isActive
                                      ? "text-cyan-400"
                                      : "text-slate-200"
                                  }
                                `}
                            >
                              {input.inputName}
                            </p>

                            <p className="mt-0.5 truncate font-mono text-[9px] text-slate-500">
                              Port: {input.portNumarasi}
                            </p>
                          </div>
                        </div>

                        {isActive && (
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="shrink-0 text-sm text-cyan-400"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==========================================================
            KANALLAR
        ========================================================== */}

        {hasActiveInput && (
          <div className="flex min-w-0 flex-col animate-fade-in-up">
            <ChannelHeader
              title="Kanal Değiştir"
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            <ChannelGrid
              channels={filteredChannels}
              onChannelChange={onChannelChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ==================================================================
// KANAL HEADER
// ==================================================================

const ChannelHeader = ({ title, searchQuery, setSearchQuery }) => {
  return (
    <div
      className="
        mb-4
        flex
        flex-col
        gap-3
        border-b
        border-slate-800/50
        pb-4

        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
          <FontAwesomeIcon icon={faSatelliteDish} />
        </div>

        <h3 className="text-sm font-bold text-slate-200">{title}</h3>
      </div>

      <div className="relative w-full sm:w-56 2xl:w-64">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
        />

        <input
          type="text"
          placeholder="Kanal ara..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="
            h-10
            w-full
            rounded-xl
            border
            border-slate-700/50
            bg-slate-950/50
            pl-9
            pr-3
            text-xs
            text-slate-200
            outline-none
            transition-all

            placeholder:text-slate-500

            focus:border-indigo-500/50
            focus:ring-1
            focus:ring-indigo-500/50

            sm:text-sm
          "
        />
      </div>
    </div>
  );
};

// ==================================================================
// KANAL GRID
// ==================================================================

const ChannelGrid = ({ channels, onChannelChange }) => {
  if (channels.length === 0) {
    return (
      <div
        className="
          col-span-full
          flex
          min-h-[220px]
          flex-col
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          border-slate-700/50
          bg-slate-900/20
          p-5
          text-center
          text-slate-500
        "
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-700/50 bg-slate-800/50">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="text-xl opacity-40"
          />
        </div>

        <p className="text-sm font-bold text-slate-400">Kanal Bulunamadı</p>

        <p className="mt-1 text-xs font-medium opacity-60">
          Bu yayın kaynağına ait aktif kanal bulunamadı.
        </p>
      </div>
    );
  }

  return (
    <div
      className="
        grid
        min-w-0
        grid-cols-2
        gap-2.5

        sm:grid-cols-3
        sm:gap-3

        2xl:grid-cols-4
      "
    >
      {channels.map((channel) => (
        <button
          type="button"
          key={channel.id}
          onClick={() => onChannelChange?.(channel.id)}
          className="
            group
            relative
            flex
            min-w-0
            flex-col
            items-center
            justify-center
            overflow-hidden
            rounded-2xl
            border
            border-slate-700/50
            bg-gradient-to-b
            from-slate-800/80
            to-slate-900/90
            p-2.5
            transition-all
            duration-300

            hover:border-indigo-500/50
            hover:from-slate-700
            hover:to-slate-800

            sm:p-3
          "
        >
          <div
            className="
              relative
              mb-2.5
              flex
              h-14
              w-full
              items-center
              justify-center
              rounded-xl
              border
              border-slate-800
              bg-slate-950/80
              p-2
              shadow-inner
              transition-all

              group-hover:border-indigo-500/40

              sm:h-16
            "
          >
            {channel.logoUrl ? (
              <img
                src={channel.logoUrl}
                alt={channel.kanalAdi}
                className="
                  relative
                  z-10
                  h-full
                  w-full
                  object-contain
                  drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]
                  transition-transform
                  duration-300

                  group-hover:scale-105
                "
              />
            ) : (
              <span
                className="
                  bg-gradient-to-br
                  from-slate-400
                  to-slate-600
                  bg-clip-text
                  text-lg
                  font-black
                  tracking-widest
                  text-transparent

                  group-hover:from-indigo-300
                  group-hover:to-cyan-300
                "
              >
                CH
              </span>
            )}
          </div>

          <div className="z-10 w-full min-w-0 space-y-1 text-center">
            <span
              title={channel.kanalAdi}
              className="
                block
                truncate
                px-1
                text-[11px]
                font-bold
                text-slate-200

                group-hover:text-white

                sm:text-xs
              "
            >
              {channel.kanalAdi}
            </span>

            <span
              className="
                inline-block
                max-w-full
                truncate
                rounded-full
                border
                border-slate-800/80
                bg-slate-950/50
                px-2
                py-0.5
                font-mono
                text-[9px]
                font-semibold
                text-slate-400
              "
            >
              NO: {channel.kanalNumarasi}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ZoneDetailPanel;
