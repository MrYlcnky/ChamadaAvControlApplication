import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad, faXmark } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

import { remoteButtonLabels } from "./remoteButtonModal/remoteButtonConstants";
import {
  areSignalsSame,
  normalizeSignal,
} from "./remoteButtonModal/signalUtils";
import LearningFormPanel from "./remoteButtonModal/LearningFormPanel";
import StandardRemoteTemplate from "./remoteButtonModal/StandardRemoteTemplate";
import FullRemoteTemplate from "./remoteButtonModal/FullRemoteTemplate";

const RemoteButtonModal = (props) => {
  if (!props.isOpen) return null;

  return <RemoteButtonModalContent {...props} />;
};

const RemoteButtonModalContent = ({
  closeModal,
  modalMode,
  formData,
  setFormData,
  handleSubmit,
  actionLoading,
  kumandalarList = [],
  piList = [],
  captureSignal,
}) => {
  const [remoteTemplate, setRemoteTemplate] = useState("standard");
  const [captureMode, setCaptureMode] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [tempSignals, setTempSignals] = useState([]);
  const [activeBtn, setActiveBtn] = useState(formData.tusKodu || null);
  const [selectedPiId, setSelectedPiId] = useState("");

  const aktifMi = formData.aktifMi !== false;
  const currentStep = Math.min(tempSignals.length + 1, 3);
  const isSignalReady = Boolean(formData.rawDataJson);
  const canClose = !actionLoading && !captureLoading && !captureMode;

  const selectedRemote = useMemo(() => {
    return kumandalarList.find(
      (item) => String(item.id) === String(formData.remoteControlId),
    );
  }, [kumandalarList, formData.remoteControlId]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && canClose) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeModal, canClose]);

  const inputClass =
    "h-12 w-full rounded-2xl border border-slate-700/80 bg-slate-950/70 px-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60";

  const labelClass =
    "mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-cyan-300/80";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "remoteControlId") {
      setCaptureMode(false);
      setTempSignals([]);
      setActiveBtn(null);

      setFormData((prev) => ({
        ...prev,
        remoteControlId: value,
        tusKodu: "",
        rawDataJson: "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRemoteButtonClick = (btnCode) => {
    if (!formData.remoteControlId) {
      toast.warning("Önce bağlı olduğu kumanda profilini seçmelisiniz.");
      return;
    }

    if (!selectedPiId) {
      toast.warning("Lütfen sinyali okuyacak Pi cihazını seçiniz.");
      return;
    }

    if (captureLoading || actionLoading) return;

    setActiveBtn(btnCode);
    setCaptureMode(true);
    setTempSignals([]);

    setFormData((prev) => ({
      ...prev,
      tusKodu: btnCode,
      rawDataJson: "",
    }));

    toast.info(
      `${remoteButtonLabels[btnCode] || btnCode} tuşu seçildi. Okuma moduna geçildi.`,
    );
  };

  const cancelCapture = () => {
    if (captureLoading || actionLoading) return;

    setCaptureMode(false);
    setTempSignals([]);
    setActiveBtn(null);

    setFormData((prev) => ({
      ...prev,
      tusKodu: "",
      rawDataJson: "",
    }));
  };

  const resetCaptureOnly = () => {
    if (captureLoading || actionLoading) return;

    setCaptureMode(Boolean(activeBtn));
    setTempSignals([]);

    setFormData((prev) => ({
      ...prev,
      rawDataJson: "",
    }));
  };

  const readIrSignal = async () => {
    if (!formData.remoteControlId || !activeBtn || !selectedPiId) {
      toast.warning("Gerekli seçimleri yapmalısınız.");
      return;
    }

    if (typeof captureSignal !== "function") {
      toast.error("Sinyal okuma fonksiyonu bağlı değil.");
      return;
    }

    try {
      setCaptureLoading(true);

      const result = await captureSignal({
        piId: Number(selectedPiId),
        remoteControlId: Number(formData.remoteControlId),
        tusKodu: activeBtn,
        attempt: currentStep,
      });

      const receivedSignal =
        result?.rawDataJson ?? result?.data?.rawDataJson ?? result;

      if (!receivedSignal) {
        toast.error("Sinyal okunamadı. Tekrar deneyin.");
        return;
      }

      const newSignals = [...tempSignals, receivedSignal];
      setTempSignals(newSignals);

      if (newSignals.length < 3) {
        toast.success(
          `${newSignals.length}. okuma alındı. Aynı tuşa tekrar basın.`,
        );
        return;
      }

      if (!areSignalsSame(newSignals)) {
        toast.error("3 sinyal eşleşmedi. Tuşu yeniden öğretin.");

        setTempSignals([]);

        setFormData((prev) => ({
          ...prev,
          rawDataJson: "",
        }));

        return;
      }

      const finalRawDataJson = normalizeSignal(newSignals[0]);

      setFormData((prev) => ({
        ...prev,
        rawDataJson: finalRawDataJson,
      }));

      setCaptureMode(false);

      toast.success(`${activeBtn} tuşu doğrulandı ve sinyal işlendi.`);
    } catch (err) {
      toast.error(
        err.response?.data?.mesaj || "Sinyal okuma sırasında hata oluştu.",
      );
    } finally {
      setCaptureLoading(false);
    }
  };

  const remoteCommonProps = {
    activeBtn,
    captureMode,
    captureLoading,
    actionLoading,
    handleRemoteButtonClick,
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={canClose ? closeModal : undefined}
      />

      <div className="relative flex max-h-[95vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-slate-900 shadow-2xl shadow-black/40">
        <div className="h-[3px] bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-500" />

        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-7 py-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
              <FontAwesomeIcon icon={faGamepad} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/80">
                Remote Button Learning
              </p>

              <h3 className="mt-2 text-2xl font-extrabold text-white">
                {modalMode === "ekle"
                  ? "Tuş & Sinyal Eşleştirme"
                  : "Tuş Düzenle"}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Görsel kumandadan tuş seçin, fiziksel kumandada aynı tuşa 3 kez
                basarak sinyali doğrulayın.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={!canClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/60 text-slate-400 transition-colors duration-200 hover:border-red-400/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            title="Kapat"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="grid overflow-y-auto lg:grid-cols-[1.2fr_1fr]">
          <LearningFormPanel
            formData={formData}
            handleSubmit={handleSubmit}
            handleChange={handleChange}
            actionLoading={actionLoading}
            captureLoading={captureLoading}
            captureMode={captureMode}
            selectedRemote={selectedRemote}
            kumandalarList={kumandalarList}
            piList={piList}
            selectedPiId={selectedPiId}
            setSelectedPiId={setSelectedPiId}
            activeBtn={activeBtn}
            tempSignals={tempSignals}
            currentStep={currentStep}
            isSignalReady={isSignalReady}
            aktifMi={aktifMi}
            inputClass={inputClass}
            labelClass={labelClass}
            resetCaptureOnly={resetCaptureOnly}
            readIrSignal={readIrSignal}
            cancelCapture={cancelCapture}
          />

          <div className="relative flex flex-col items-center justify-start bg-slate-950 p-6">
            <div className="z-20 mb-6 flex gap-2 rounded-xl border border-slate-800 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setRemoteTemplate("standard")}
                disabled={captureMode}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  remoteTemplate === "standard"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-500 hover:text-slate-300 disabled:opacity-50"
                }`}
              >
                Standart Kumanda
              </button>

              <button
                type="button"
                onClick={() => setRemoteTemplate("full")}
                disabled={captureMode}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  remoteTemplate === "full"
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 hover:text-slate-300 disabled:opacity-50"
                }`}
              >
                Gelişmiş Kumanda
              </button>
            </div>

            {captureMode && (
              <div className="pointer-events-none absolute inset-0 z-10 rounded-r-[2rem] bg-slate-950/60 backdrop-blur-[2px]" />
            )}

            {remoteTemplate === "standard" && (
              <StandardRemoteTemplate {...remoteCommonProps} />
            )}

            {remoteTemplate === "full" && (
              <FullRemoteTemplate {...remoteCommonProps} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteButtonModal;
