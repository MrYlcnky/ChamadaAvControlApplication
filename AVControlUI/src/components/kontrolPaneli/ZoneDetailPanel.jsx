import { useState, useRef, useEffect } from "react";
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

const LoadingOverlay = () => (
  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm rounded-[2rem]">
    <div className="h-20 w-20 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl border border-cyan-500/20">
      <FontAwesomeIcon
        icon={faSpinner}
        spin
        className="text-4xl text-cyan-400"
      />
    </div>
    <p className="mt-4 font-bold text-cyan-300 tracking-widest animate-pulse">
      SİNYAL GÖNDERİLİYOR...
    </p>
  </div>
);

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
  //onBulkChannelChange, // Çoklu kanal değişimi için eklendi
  onTvControl,
  onLedModeChange,
}) => {
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Hem tekli hem çoklu seçimde anlık arayüz değişimi için tek bir state kullanıyoruz
  const [localActiveInputId, setLocalActiveInputId] = useState(
    activeInputId ?? null,
  );

  const dropdownRef = useRef(null);

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

  // Parent'tan activeInputId geç gelirse local state'i senkronla
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalActiveInputId(activeInputId ?? null);
  }, [activeInputId]);

  // Menü dışına tıklamayı algılama
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

  // Farklı bir ekrana veya kaynağa geçildiğinde aramayı sıfırla
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchQuery("");
  }, [singleOutput?.id, localActiveInputId]);

  const rawRol = localStorage.getItem("rol");
  const safeRol = rawRol ? String(rawRol).toLowerCase() : "";
  const isAdmin = safeRol === "1" || safeRol === "admin";

  const activeInputDetails = inputs.find(
    (input) => String(input.id) === String(localActiveInputId),
  );

  const availableInputs = singleOutput
    ? inputs.filter(
        (input) =>
          String(input.matrixDeviceId) === String(singleOutput.matrixDeviceId),
      )
    : [];

  const filteredChannels = channels.filter((channel) => {
    // Sadece aktif yayına ait kanallar gelsin
    if (String(channel.inputSourceId) !== String(localActiveInputId)) {
      return false;
    }

    const loweredSearch = searchQuery.toLowerCase();
    const matchesSearch =
      (channel.kanalAdi?.toLowerCase() || "").includes(loweredSearch) ||
      (channel.kanalNumarasi?.toString() || "").includes(searchQuery);

    if (!channel.aktifMi) return false;
    if (isAdmin) return matchesSearch;
    return matchesSearch && channel.kullanicidaGosterilsinMi;
  });

  // TEKLİ KAYNAK DEĞİŞİMİ
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

  // ÇOKLU KAYNAK DEĞİŞİMİ
  const handleBulkSourceSelect = async (inputId) => {
    const previousInputId = localActiveInputId;
    setLocalActiveInputId(inputId); // Çoklu seçimde de kanal listesinin anında gelmesi için

    try {
      await onBulkSourceChange?.(inputId);
    } catch (error) {
      setLocalActiveInputId(previousInputId);
      console.error("Toplu kaynak değiştirme hatası:", error);
    }
  };

  // 1. DURUM: BÖLGE SEÇİLMEDİ
  if (selectedOutputList.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-transparent text-slate-500 z-10">
        <div className="h-32 w-32 rounded-full bg-slate-800/30 flex items-center justify-center mb-6 shadow-inner border border-slate-700/50">
          <FontAwesomeIcon
            icon={faSignal}
            className="text-6xl opacity-40 text-cyan-500"
          />
        </div>
        <p className="text-2xl font-bold text-slate-400">Bölge Seçilmedi</p>
        <p className="text-sm mt-2 opacity-60">
          Kontrol etmek için sol menüden bir veya birden fazla ekran seçin.
        </p>
      </div>
    );
  }

  // 2. DURUM: ÇOKLU SEÇİM
  if (isMultiple) {
    return (
      <div className="flex-1 flex flex-col relative bg-transparent z-10">
        {actionLoading && <LoadingOverlay />}

        <div className="flex-1 flex flex-col p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          <div className="mb-8 bg-slate-950/30 rounded-3xl border border-slate-800/50 p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faLayerGroup}
                    className="text-cyan-500"
                  />
                  {selectedOutputList.length} Bölge Seçildi
                </h2>
                <p className="text-slate-400 mt-2 text-sm">
                  Bu bölgelerin tümüne aynı yayın kaynağını atamak için aşağıdan
                  seçim yapın.
                </p>
              </div>
              <div className="hidden lg:flex h-16 w-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 items-center justify-center shadow-inner">
                <FontAwesomeIcon icon={faVideo} className="text-3xl" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {selectedOutputList.map((output) => (
                <span
                  key={output.id}
                  className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/70 text-xs font-bold text-slate-300"
                >
                  {output.bolgeAdi}
                </span>
              ))}
            </div>
          </div>

          {isMixedMatrixSelection ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-900/20 rounded-[2rem] border border-dashed border-slate-700/50 p-10">
              <div className="h-16 w-16 mb-4 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <FontAwesomeIcon
                  icon={faSignal}
                  className="text-2xl text-red-400"
                />
              </div>
              <p className="text-[15px] font-bold text-slate-300">
                Farklı Matrix Cihazlarına Ait Bölgeler Seçildi
              </p>
              <p className="text-xs mt-2 font-medium text-slate-500 max-w-xl">
                Toplu kaynak değişimi yapabilmek için aynı matrix cihazına bağlı
                bölgeleri birlikte seçmelisiniz.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5 border-b border-slate-800/50 pb-4">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <FontAwesomeIcon icon={faSatelliteDish} />
                </div>
                <h3 className="text-sm font-bold text-slate-200">
                  Toplu Kaynak Değiştir
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {bulkAvailableInputs.map((input) => {
                  const isBulkSelected =
                    String(localActiveInputId) === String(input.id);

                  return (
                    <button
                      key={input.id}
                      onClick={() => handleBulkSourceSelect(input.id)}
                      className={`group relative flex flex-col items-center justify-center p-5 rounded-[1.8rem] bg-gradient-to-b border backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 overflow-hidden cursor-pointer ${
                        isBulkSelected
                          ? "from-cyan-500/20 to-slate-900/90 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.20)]"
                          : "from-slate-800/80 to-slate-900/90 border-slate-700/50 hover:from-slate-700 hover:to-slate-800 hover:border-cyan-500/50 hover:shadow-[0_15px_30px_-5px_rgba(34,211,238,0.25)]"
                      }`}
                    >
                      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/0 group-hover:via-cyan-400/80 to-transparent transition-all duration-500"></div>

                      <div
                        className={`h-14 w-14 rounded-2xl border flex items-center justify-center mb-4 transition-all ${
                          isBulkSelected
                            ? "bg-cyan-500 text-white border-cyan-300"
                            : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white"
                        }`}
                      >
                        <FontAwesomeIcon icon={faVideo} className="text-2xl" />
                      </div>

                      <span className="text-[14px] font-bold text-slate-200 group-hover:text-white text-center truncate w-full">
                        {input.inputName}
                      </span>

                      <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-slate-950/50 border border-slate-800/80 text-[10px] font-mono text-slate-400 font-semibold group-hover:border-cyan-500/30 group-hover:text-cyan-300 transition-all">
                        Matrix Port: {input.portNumarasi}
                      </span>

                      {isBulkSelected && (
                        <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-lg">
                          <FontAwesomeIcon icon={faCheck} className="text-xs" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ÇOKLU SEÇİM İÇİN KANAL LİSTESİ */}
              {hasActiveInput && (
                <div className="animate-fade-in-up flex-1 flex flex-col mt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-800/50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <FontAwesomeIcon icon={faSatelliteDish} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-200">
                        Toplu Kanal Değiştir
                      </h3>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Kanal ara..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-950/50 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredChannels.length > 0 ? (
                      filteredChannels.map((channel) => (
                        <button
                          key={channel.id}
                          onClick={() => onChannelChange?.(channel.id)}
                          className="group relative flex flex-col items-center justify-center p-4 rounded-[1.8rem] bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/50 backdrop-blur-sm transition-all duration-300 hover:from-slate-700 hover:to-slate-800 hover:border-indigo-500/50 hover:shadow-[0_15px_30px_-5px_rgba(99,102,241,0.25)] hover:-translate-y-1.5 overflow-hidden cursor-pointer"
                        >
                          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/0 group-hover:via-indigo-400/80 to-transparent transition-all duration-500"></div>

                          <div className="relative h-[4.5rem] w-full rounded-2xl bg-slate-950/80 mb-4 flex items-center justify-center p-3 border border-slate-800 shadow-inner group-hover:border-indigo-500/40 group-hover:shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] transition-all">
                            {channel.logoUrl ? (
                              <div className="h-full w-full relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-slate-900/10 rounded-lg"></div>
                                <img
                                  src={channel.logoUrl}
                                  alt={channel.kanalAdi}
                                  className="h-full w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-all duration-300 z-10"
                                />
                              </div>
                            ) : (
                              <span className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-slate-400 to-slate-600 group-hover:from-indigo-300 group-hover:to-cyan-300 transition-all duration-300">
                                CH
                              </span>
                            )}
                          </div>

                          <div className="w-full text-center space-y-1 z-10">
                            <span className="block text-[13px] font-bold text-slate-200 group-hover:text-white truncate px-1 transition-colors">
                              {channel.kanalAdi}
                            </span>
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-950/50 border border-slate-800/80 text-[10px] font-mono text-slate-400 font-semibold group-hover:border-indigo-500/30 group-hover:text-indigo-300 transition-all">
                              NO: {channel.kanalNumarasi}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 rounded-[2rem] border border-dashed border-slate-700/50">
                        <div className="h-16 w-16 mb-4 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                          <FontAwesomeIcon
                            icon={faMagnifyingGlass}
                            className="text-2xl opacity-40 text-slate-400"
                          />
                        </div>
                        <p className="text-[15px] font-bold text-slate-400">
                          Kanal Bulunamadı
                        </p>
                        <p className="text-xs mt-1 font-medium opacity-60">
                          Bu yayın kaynağına ait aktif kanal bulunamadı.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // 3. DURUM: TEKLİ SEÇİM
  return (
    <div className="flex-1 flex flex-col relative bg-transparent z-10">
      {actionLoading && <LoadingOverlay />}

      <div className="flex-1 flex flex-col p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* SOL KART: BÖLGE ADI, LED MODU VE TV KONTROLLERİ */}
          <div className="flex flex-col justify-between bg-slate-950/30 px-6 pt-2 rounded-3xl border border-slate-800/50">
            <div className="flex justify-between items-start w-full">
              <div className="w-full">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 truncate">
                  {singleOutput.bolgeAdi}
                </h1>

                {/* NOVASTAR / VIPLEX MANUEL KONTROL BUTONLARI */}
                {singleOutput.viplexKontroluVarMi && (
                  <div className="mt-3 pt-2 border-t border-slate-800/50 animate-fade-in-up w-full">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                      Ekran Modu
                    </p>

                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => onLedModeChange?.(1)}
                        className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold hover:bg-purple-500 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
                      >
                        <FontAwesomeIcon
                          icon={faCirclePlay}
                          className="mr-2 text-sm"
                        />
                        Reklam Modu
                      </button>

                      <button
                        onClick={() => onLedModeChange?.(2)}
                        className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all"
                      >
                        <FontAwesomeIcon icon={faTv} className="mr-2 text-sm" />
                        Tam Ekran
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TV KONTROLLERİ */}
            {singleOutput.remoteControlId ? (
              <div className="flex gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-700/50 shadow-lg w-fit mt-6 mb-4">
                <button
                  onClick={() => onTvControl?.("POWER")}
                  className="h-11 w-11 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                  title="Kapat/Aç"
                >
                  <FontAwesomeIcon icon={faPowerOff} className="text-lg" />
                </button>

                <div className="w-px bg-slate-800 my-2 mx-1"></div>

                <button
                  onClick={() => onTvControl?.("VOL_DOWN")}
                  className="h-11 w-11 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-700 transition-colors"
                  title="Sesi Kıs"
                >
                  <FontAwesomeIcon icon={faVolumeDown} />
                </button>

                <button
                  onClick={() => onTvControl?.("MUTE")}
                  className="h-11 w-11 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-700 transition-colors"
                  title="Sessiz"
                >
                  <FontAwesomeIcon icon={faVolumeXmark} />
                </button>

                <button
                  onClick={() => onTvControl?.("VOL_UP")}
                  className="h-11 w-11 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-700 transition-colors"
                  title="Sesi Aç"
                >
                  <FontAwesomeIcon icon={faVolumeUp} />
                </button>
              </div>
            ) : (
              <div className="mt-6 text-xs text-slate-600 italic"></div>
            )}
          </div>

          {/* SAĞ KART: CANLI YAYIN VE DROPDOWN */}
          <div className="relative flex flex-col z-30" ref={dropdownRef}>
            <button
              onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
              className={`w-full text-left relative overflow-hidden rounded-3xl border transition-all duration-300 bg-gradient-to-br from-slate-900 to-slate-950 p-1 flex flex-col group ${
                isSourceDropdownOpen
                  ? "border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.25)]"
                  : "border-cyan-500/30 hover:border-cyan-400/70 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
              }`}
            >
              <div className="absolute top-0 left-0 w-1 bg-cyan-400 h-full shadow-[0_0_20px_#22d3ee]"></div>

              <div className="flex-1 flex flex-col justify-center p-6 bg-slate-900/50 rounded-[1.3rem] backdrop-blur-xl">
                <p className="text-[11px] font-bold text-cyan-400/80 uppercase tracking-[0.2em] mb-4">
                  Canlı Yayın Kaynağı{" "}
                  <span className="text-slate-500 normal-case tracking-normal ml-1">
                    (Değiştirmek için tıklayın)
                  </span>
                </p>

                <div className="flex items-center justify-between">
                  {activeInputDetails ? (
                    <div className="flex items-center gap-5">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner flex-shrink-0">
                        <FontAwesomeIcon
                          icon={faCirclePlay}
                          className="text-4xl animate-pulse"
                        />
                      </div>

                      <div className="overflow-hidden">
                        <h2 className="text-3xl font-extrabold text-white tracking-tight truncate">
                          {activeInputDetails.inputName}
                        </h2>

                        <p className="text-sm font-mono text-cyan-400/60 mt-1.5 flex items-center gap-2">
                          <FontAwesomeIcon icon={faServer} />
                          Matrix Port: {activeInputDetails.portNumarasi}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-5 opacity-60">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 flex-shrink-0">
                        <FontAwesomeIcon icon={faTv} className="text-4xl" />
                      </div>

                      <h2 className="text-xl font-bold text-slate-400">
                        Yayın Yok
                      </h2>
                    </div>
                  )}

                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`text-2xl mr-2 transition-transform duration-300 ${
                      isSourceDropdownOpen
                        ? "rotate-180 text-cyan-400"
                        : "text-slate-600 group-hover:text-cyan-300"
                    }`}
                  />
                </div>
              </div>
            </button>

            {isSourceDropdownOpen && (
              <div className="absolute top-[calc(100%+12px)] left-0 w-full bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col z-50 p-3 animate-fade-in-up">
                <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/80 mb-2">
                  Geçiş Yapılacak Kaynağı Seçin
                </p>

                <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-2 space-y-1.5">
                  {availableInputs.map((input) => {
                    const isActive =
                      String(localActiveInputId) === String(input.id);

                    return (
                      <button
                        key={input.id}
                        onClick={() => handleSourceSelect(input.id)}
                        disabled={isActive}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 ${
                          isActive
                            ? "bg-cyan-500/10 border border-cyan-500/30 cursor-default"
                            : "bg-slate-800/30 border border-transparent hover:bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                              isActive
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={faVideo}
                              className="text-xl"
                            />
                          </div>

                          <div className="text-left">
                            <p
                              className={`font-bold text-[15px] ${
                                isActive ? "text-cyan-400" : "text-slate-200"
                              }`}
                            >
                              {input.inputName}
                            </p>

                            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                              Matrix Port: {input.portNumarasi}
                            </p>
                          </div>
                        </div>

                        {isActive && (
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="text-cyan-400 mr-4 text-xl"
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

        {/* TEKLİ SEÇİM İÇİN KANAL LİSTESİ */}
        {hasActiveInput && (
          <div className="animate-fade-in-up flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-800/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <FontAwesomeIcon icon={faSatelliteDish} />
                </div>

                <h3 className="text-sm font-bold text-slate-200">
                  Kanal Değiştir
                </h3>
              </div>

              <div className="relative w-full sm:w-64">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"
                />

                <input
                  type="text"
                  placeholder="Kanal ara..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-950/50 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredChannels.length > 0 ? (
                filteredChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => onChannelChange?.(channel.id)}
                    className="group relative flex flex-col items-center justify-center p-4 rounded-[1.8rem] bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/50 backdrop-blur-sm transition-all duration-300 hover:from-slate-700 hover:to-slate-800 hover:border-indigo-500/50 hover:shadow-[0_15px_30px_-5px_rgba(99,102,241,0.25)] hover:-translate-y-1.5 overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/0 group-hover:via-indigo-400/80 to-transparent transition-all duration-500"></div>

                    <div className="relative h-[4.5rem] w-full rounded-2xl bg-slate-950/80 mb-4 flex items-center justify-center p-3 border border-slate-800 shadow-inner group-hover:border-indigo-500/40 group-hover:shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] transition-all">
                      {channel.logoUrl ? (
                        <div className="h-full w-full relative flex items-center justify-center">
                          <div className="absolute inset-0 bg-slate-900/10 rounded-lg"></div>

                          <img
                            src={channel.logoUrl}
                            alt={channel.kanalAdi}
                            className="h-full w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-all duration-300 z-10"
                          />
                        </div>
                      ) : (
                        <span className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-slate-400 to-slate-600 group-hover:from-indigo-300 group-hover:to-cyan-300 transition-all duration-300">
                          CH
                        </span>
                      )}
                    </div>

                    <div className="w-full text-center space-y-1 z-10">
                      <span className="block text-[13px] font-bold text-slate-200 group-hover:text-white truncate px-1 transition-colors">
                        {channel.kanalAdi}
                      </span>

                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-950/50 border border-slate-800/80 text-[10px] font-mono text-slate-400 font-semibold group-hover:border-indigo-500/30 group-hover:text-indigo-300 transition-all">
                        NO: {channel.kanalNumarasi}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 rounded-[2rem] border border-dashed border-slate-700/50">
                  <div className="h-16 w-16 mb-4 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                    <FontAwesomeIcon
                      icon={faMagnifyingGlass}
                      className="text-2xl opacity-40 text-slate-400"
                    />
                  </div>

                  <p className="text-[15px] font-bold text-slate-400">
                    Kanal Bulunamadı
                  </p>

                  <p className="text-xs mt-1 font-medium opacity-60">
                    Bu yayın kaynağına ait aktif kanal bulunamadı.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoneDetailPanel;
