import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faArrowRightToBracket,
  faArrowRightFromBracket,
  faServer,
  faMicrochip,
  faTv,
  faSpinner,
  faSave,
  faTrash,
  faPlugCircleXmark,
  faPlugCircleCheck,
  faMobileScreen,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

import inputSourceService from "../../../services/inputSourceService";
import outputZoneService from "../../../services/outputZoneService";
import irTransmitterService from "../../../services/irTransmitterService";
import ledProcessorService from "../../../services/ledProcessorService";
import matrixService from "../../../services/matrixService";
import remoteControlService from "../../../services/remoteControlService";

const MatrixPortModal = ({ isOpen, onClose, device }) => {
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [piList, setPiList] = useState([]);
  const [ledList, setLedList] = useState([]);
  const [remoteList, setRemoteList] = useState([]);

  const [liveStatus, setLiveStatus] = useState({
    baglantiBasarili: false,
    girisler: [],
    cikislar: [],
  });

  const [selectedPort, setSelectedPort] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    isim: "",
    piId: "",
    ledId: "",
    kumandaId: "",
  });

  const fetchData = async () => {
    if (!device) return;
    setLoading(true);
    setIsSyncing(true);
    try {
      const [allInputs, allOutputs, allPis, allLeds, allRemotes, liveData] =
        await Promise.all([
          inputSourceService.tumunuGetir(),
          outputZoneService.tumunuGetir(),
          irTransmitterService.getAll(),
          ledProcessorService.getAll(),
          remoteControlService.getAll(),
          matrixService.getLiveStatus(device.id),
        ]);

      setInputs(
        Array.isArray(allInputs)
          ? allInputs.filter((i) => i.matrixDeviceId === device.id)
          : [],
      );
      setOutputs(
        Array.isArray(allOutputs)
          ? allOutputs.filter((o) => o.matrixDeviceId === device.id)
          : [],
      );
      setPiList(allPis || []);
      setLedList(allLeds || []);
      setRemoteList(allRemotes || []);

      setLiveStatus(liveData);

      if (!liveData.baglantiBasarili) {
        toast.warning(
          "Matrix cihazına ulaşılamadı. Port durumları manuel yönetiliyor.",
        );
      }
    } catch (error) {
      toast.error("Veriler çekilirken hata oluştu.");
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isOpen && device) {
      fetchData();
      setSelectedPort(null);
    }
  }, [device, isOpen]);

  if (!isOpen || !device) return null;

  const inputPorts = Array.from(
    { length: device.inputSayisi },
    (_, i) => i + 1,
  );
  const outputPorts = Array.from(
    { length: device.outputSayisi },
    (_, i) => i + 1,
  );

  const handlePortClick = (
    type,
    portNumber,
    portCode, // YENİ: Harf veya rakam formatındaki asıl port kodu
    existingData,
    gefenData,
    hasSignal,
  ) => {
    if (!hasSignal && liveStatus.baglantiBasarili) {
      toast.error(
        `Port ${portCode} üzerinde donanımsal bir bağlantı (HDMI) algılanamadı!`,
      );
      return;
    }

    setSelectedPort({
      type,
      number: portNumber,
      code: portCode,
      data: existingData,
    });

    setFormData({
      isim:
        type === "input"
          ? existingData?.inputName || gefenData?.gefenIsim || ""
          : existingData?.bolgeAdi || gefenData?.gefenIsim || "",
      piId: existingData?.irTransmitterId || "",
      ledId: type === "output" ? existingData?.ledProcessorId || "" : "",
      kumandaId: existingData?.remoteControlId || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.isim.trim()) {
      toast.warning("Lütfen bir isim giriniz.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedPort.type === "input") {
        const payload = {
          inputName: formData.isim,
          matrixDeviceId: device.id,
          portNumarasi: parseInt(selectedPort.code), // Input portu sayıdır
          irTransmitterId: formData.piId ? parseInt(formData.piId) : null,
          remoteControlId: formData.kumandaId
            ? parseInt(formData.kumandaId)
            : null,
          kanalKontrolVarMi: !!formData.kumandaId,
          aktifMi: true,
        };

        if (selectedPort.data) {
          await inputSourceService.guncelle({
            ...payload,
            id: selectedPort.data.id,
          });
          toast.success("Giriş güncellendi.");
        } else {
          await inputSourceService.ekle(payload);
          toast.success("Giriş başarıyla eklendi.");
        }
      } else {
        const payload = {
          bolgeAdi: formData.isim,
          matrixDeviceId: device.id,
          portKodu: selectedPort.code.toString(), // Output portu Harftir (A, B, C...)
          ledProcessorId: formData.ledId ? parseInt(formData.ledId) : null,
          irTransmitterId: formData.piId ? parseInt(formData.piId) : null,
          remoteControlId: formData.kumandaId
            ? parseInt(formData.kumandaId)
            : null,
          aktifMi: true,
        };

        if (selectedPort.data) {
          await outputZoneService.guncelle({
            ...payload,
            id: selectedPort.data.id,
          });
          toast.success("Çıkış güncellendi.");
        } else {
          await outputZoneService.ekle(payload);
          toast.success("Çıkış başarıyla eklendi.");
        }
      }

      setSelectedPort(null);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.mesaj || "Kayıt işlemi başarısız.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPort?.data) return;

    const result = await Swal.fire({
      title: "Bağlantıyı Kopar?",
      text: "Bu porttaki cihaz tanımı silinecektir.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, Sil",
      cancelButtonText: "İptal",
      background: "#0f172a",
      color: "#e5e7eb",
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      try {
        if (selectedPort.type === "input") {
          await inputSourceService.sil(selectedPort.data.id);
        } else {
          await outputZoneService.sil(selectedPort.data.id);
        }
        toast.success("Port bağlantısı temizlendi.");
        setSelectedPort(null);
        await fetchData();
      } catch (error) {
        toast.error("Silme başarısız oldu.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-7xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div
          className={`flex flex-col transition-all duration-300 ${selectedPort ? "w-2/3 border-r border-slate-800" : "w-full"}`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/50 p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                <FontAwesomeIcon icon={faServer} className="text-indigo-400" />
                {device.cihazAdi} - Port Yönetimi
                {isSyncing && (
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-sm text-cyan-400 ml-2"
                  />
                )}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {liveStatus.baglantiBasarili
                  ? "Cihaz ile canlı bağlantı kuruldu. Aktif portlarda işlem yapabilirsiniz."
                  : "Cihaz ile canlı bağlantı kurulamadı. Port durumları manuel yönetiliyor."}
              </p>
            </div>
            {!selectedPort && (
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto bg-[url('/grid-pattern.svg')] bg-center p-8">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="text-4xl text-indigo-500"
                />
              </div>
            ) : (
              <div className="flex items-stretch justify-between gap-8">
                {/* INPUTS (GİRİŞLER) */}
                <div className="flex w-1/3 flex-col gap-3">
                  <h3 className="mb-2 text-center text-sm font-bold uppercase text-emerald-400">
                    <FontAwesomeIcon
                      icon={faArrowRightToBracket}
                      className="mr-2"
                    />{" "}
                    Girişler (IN)
                  </h3>
                  {inputPorts.map((portNumber) => {
                    const portCode = portNumber.toString(); // Inputlarda port kodu sayıdır
                    const existingInput = inputs.find(
                      (i) => i.portNumarasi === portNumber,
                    );
                    const isActiveForm =
                      selectedPort?.type === "input" &&
                      selectedPort?.number === portNumber;
                    const gefenData = liveStatus.girisler?.find(
                      (g) => g.port === portNumber,
                    );
                    const hasSignal = liveStatus.baglantiBasarili
                      ? gefenData?.sinyalVar || false
                      : true;
                    const gefenName =
                      gefenData?.gefenIsim || `INPUT ${portCode}`;

                    return (
                      <div
                        key={`in-${portNumber}`}
                        onClick={() =>
                          handlePortClick(
                            "input",
                            portNumber,
                            portCode,
                            existingInput,
                            gefenData,
                            hasSignal,
                          )
                        }
                        className={`group relative overflow-hidden rounded-xl border p-3 transition-all ${
                          !hasSignal
                            ? "border-slate-800 bg-slate-900/30 opacity-60 cursor-not-allowed"
                            : isActiveForm
                              ? "border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-500/20 cursor-pointer"
                              : existingInput
                                ? "border-emerald-500/50 bg-slate-800/90 hover:border-emerald-400 cursor-pointer"
                                : "border-slate-700 border-dashed bg-slate-900/80 hover:border-emerald-500/50 cursor-pointer"
                        }`}
                      >
                        <div
                          className={`absolute left-0 top-0 flex h-full w-8 items-center justify-center text-xs font-bold border-r ${hasSignal ? "bg-emerald-950/50 text-emerald-500 border-emerald-900/50" : "bg-slate-950/50 text-slate-600 border-slate-800/50"}`}
                        >
                          {portCode}
                        </div>
                        <div className="pl-10 flex justify-between items-center">
                          <div>
                            {existingInput ? (
                              <>
                                <div
                                  className={`font-bold ${hasSignal ? "text-emerald-300" : "text-slate-500 line-through"}`}
                                >
                                  {existingInput.inputName}
                                </div>
                                {existingInput.irTransmitterAdi && (
                                  <div className="mt-1 text-xs text-slate-400 truncate">
                                    <FontAwesomeIcon
                                      icon={faMicrochip}
                                      className="mr-1 text-indigo-400"
                                    />
                                    {existingInput.irTransmitterAdi}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div
                                className={`flex h-full items-center text-xs font-bold ${hasSignal ? "text-emerald-500/70 group-hover:text-emerald-400" : "text-slate-600"}`}
                              >
                                {hasSignal ? gefenName : "Sinyal Yok"}
                              </div>
                            )}
                          </div>
                          {hasSignal ? (
                            <FontAwesomeIcon
                              icon={faPlugCircleCheck}
                              className="text-emerald-500"
                              title="HDMI Sinyali Var"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faPlugCircleXmark}
                              className="text-slate-600"
                              title="Bağlantı Yok"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* MATRIX MERKEZ */}
                <div className="flex w-1/4 flex-col items-center justify-center">
                  <div className="flex flex-col items-center justify-center opacity-70">
                    <FontAwesomeIcon
                      icon={faServer}
                      className="text-6xl text-indigo-500/50"
                    />
                    <div className="mt-4 font-mono font-bold text-indigo-300/50 tracking-widest">
                      MATRIX
                    </div>
                  </div>
                </div>

                {/* OUTPUTS (ÇIKIŞLAR) */}
                <div className="flex w-1/3 flex-col gap-3">
                  <h3 className="mb-2 text-center text-sm font-bold uppercase text-blue-400">
                    Çıkışlar (OUT){" "}
                    <FontAwesomeIcon
                      icon={faArrowRightFromBracket}
                      className="ml-2"
                    />
                  </h3>
                  {outputPorts.map((portNumber) => {
                    // 🔥 MÜKEMMEL DOKUNUŞ: 1->A, 2->B, 8->H şeklinde harfe çeviriyoruz!
                    const portCode = String.fromCharCode(64 + portNumber);

                    // Veritabanında portKodu "A" olarak kayıtlı olanı bul
                    const existingOutput = outputs.find(
                      (o) =>
                        o.portKodu === portCode ||
                        o.portKodu === portNumber.toString(),
                    );
                    const isActiveForm =
                      selectedPort?.type === "output" &&
                      selectedPort?.number === portNumber;
                    const gefenData = liveStatus.cikislar?.find(
                      (c) => c.port === portNumber,
                    );
                    const hasSignal = liveStatus.baglantiBasarili
                      ? gefenData?.sinyalVar || false
                      : true;
                    const gefenName =
                      gefenData?.gefenIsim || `OUTPUT ${portCode}`;

                    return (
                      <div
                        key={`out-${portNumber}`}
                        onClick={() =>
                          handlePortClick(
                            "output",
                            portNumber,
                            portCode,
                            existingOutput,
                            gefenData,
                            hasSignal,
                          )
                        }
                        className={`group relative overflow-hidden rounded-xl border p-3 transition-all ${
                          !hasSignal
                            ? "border-slate-800 bg-slate-900/30 opacity-60 cursor-not-allowed"
                            : isActiveForm
                              ? "border-blue-400 bg-blue-500/10 ring-2 ring-blue-500/20 cursor-pointer"
                              : existingOutput
                                ? "border-blue-500/50 bg-slate-800/90 hover:border-blue-400 cursor-pointer"
                                : "border-slate-700 border-dashed bg-slate-900/80 hover:border-blue-500/50 cursor-pointer"
                        }`}
                      >
                        <div className="pl-2 pr-10 flex justify-between items-center text-right">
                          {hasSignal ? (
                            <FontAwesomeIcon
                              icon={faPlugCircleCheck}
                              className="text-blue-500"
                              title="Ekran Bağlı"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faPlugCircleXmark}
                              className="text-slate-600"
                              title="Bağlantı Yok"
                            />
                          )}
                          <div className="flex-1">
                            {existingOutput ? (
                              <>
                                <div
                                  className={`font-bold ${hasSignal ? "text-blue-300" : "text-slate-500 line-through"}`}
                                >
                                  {existingOutput.bolgeAdi}
                                </div>
                                {existingOutput.ledProcessorAdi && (
                                  <div className="mt-1 text-xs text-slate-400 truncate">
                                    <FontAwesomeIcon
                                      icon={faTv}
                                      className="mr-1 text-indigo-400"
                                    />
                                    {existingOutput.ledProcessorAdi}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div
                                className={`flex h-full items-center justify-end text-xs font-bold ${hasSignal ? "text-blue-500/70 group-hover:text-blue-400" : "text-slate-600"}`}
                              >
                                {hasSignal ? gefenName : "Sinyal Yok"}
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          className={`absolute right-0 top-0 flex h-full w-8 items-center justify-center text-sm font-extrabold border-l ${hasSignal ? "bg-blue-950/50 text-blue-500 border-blue-900/50" : "bg-slate-950/50 text-slate-600 border-slate-800/50"}`}
                        >
                          {portCode}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SAĞ ALAN: DÜZENLEME FORMU */}
        {selectedPort && (
          <div className="w-1/3 bg-slate-950/80 flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between border-b border-slate-800 p-6">
              <h3 className="font-bold text-white">
                Port{" "}
                <span className="text-cyan-400 text-lg">
                  {selectedPort.code}
                </span>{" "}
                Ayarları
                <span
                  className={`ml-2 text-xs px-2 py-1 rounded-md ${selectedPort.type === "input" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}
                >
                  {selectedPort.type.toUpperCase()}
                </span>
              </h3>
              <button
                onClick={() => setSelectedPort(null)}
                className="text-slate-400 hover:text-white"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-auto">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    {selectedPort.type === "input"
                      ? "Kaynak Adı (Örn: Apple TV)"
                      : "Bölge Adı (Örn: Salon LED)"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.isim}
                    onChange={(e) =>
                      setFormData({ ...formData, isim: e.target.value })
                    }
                    className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white focus:border-cyan-400 focus:outline-none"
                    placeholder="İsim girin..."
                  />
                </div>

                {selectedPort.type === "input" && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faMicrochip}
                          className="text-indigo-400"
                        />
                        Sinyal Gönderici Cihaz (Pi)
                      </label>
                      <select
                        value={formData.piId}
                        onChange={(e) =>
                          setFormData({ ...formData, piId: e.target.value })
                        }
                        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white focus:border-cyan-400 focus:outline-none"
                      >
                        <option value="">
                          -- Raspberry Pi Seç (Opsiyonel) --
                        </option>
                        {piList.map((pi) => (
                          <option key={pi.id} value={pi.id}>
                            {pi.cihazAdi} ({pi.ipAdresi})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faMobileScreen}
                          className="text-emerald-400"
                        />
                        Kullanılacak Kumanda
                      </label>
                      <select
                        value={formData.kumandaId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            kumandaId: e.target.value,
                          })
                        }
                        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white focus:border-cyan-400 focus:outline-none"
                      >
                        <option value="">-- Kumanda Seç (Opsiyonel) --</option>
                        {remoteList.map((remote) => (
                          <option key={remote.id} value={remote.id}>
                            {remote.kumandaMarkaModel}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {selectedPort.type === "output" && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faTv}
                          className="text-blue-400"
                        />
                        LED Processor (Opsiyonel)
                      </label>
                      <select
                        value={formData.ledId}
                        onChange={(e) =>
                          setFormData({ ...formData, ledId: e.target.value })
                        }
                        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white focus:border-cyan-400 focus:outline-none"
                      >
                        <option value="">-- Donanım Bağlama --</option>
                        {ledList.map((led) => (
                          <option key={led.id} value={led.id}>
                            {led.cihazAdi} ({led.ipAdresi})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4 border-t border-slate-800 pt-4">
                      <p className="text-xs text-slate-400 mb-4 italic">
                        Ekranı açıp kapatmak için aşağıdaki donanımları
                        eşleştirin.
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <FontAwesomeIcon
                              icon={faMicrochip}
                              className="text-indigo-400"
                            />
                            Odadaki Sinyal Cihazı (Pi)
                          </label>
                          <select
                            value={formData.piId}
                            onChange={(e) =>
                              setFormData({ ...formData, piId: e.target.value })
                            }
                            className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white focus:border-cyan-400 focus:outline-none"
                          >
                            <option value="">
                              -- Raspberry Pi Seç (Opsiyonel) --
                            </option>
                            {piList.map((pi) => (
                              <option key={pi.id} value={pi.id}>
                                {pi.cihazAdi} ({pi.ipAdresi})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <FontAwesomeIcon
                              icon={faMobileScreen}
                              className="text-emerald-400"
                            />
                            Odadaki Ekranın Kumandası
                          </label>
                          <select
                            value={formData.kumandaId}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                kumandaId: e.target.value,
                              })
                            }
                            className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white focus:border-cyan-400 focus:outline-none"
                          >
                            <option value="">
                              -- Kumanda Seç (Opsiyonel) --
                            </option>
                            {remoteList.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.kumandaMarkaModel}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 font-bold text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
                >
                  <FontAwesomeIcon
                    icon={isSubmitting ? faSpinner : faSave}
                    spin={isSubmitting}
                  />
                  {selectedPort.data ? "Güncelle" : "Kaydet"}
                </button>
                {selectedPort.data && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-500/50 text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faTrash} /> Bağlantıyı Kaldır
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatrixPortModal;
