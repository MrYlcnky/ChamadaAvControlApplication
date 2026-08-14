import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faRotateLeft,
  faSignal,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { remoteButtonLabels } from "./remoteButtonConstants";

const LearningFormPanel = ({
  formData,
  handleSubmit,
  handleChange,
  actionLoading,
  captureLoading,
  captureMode,
  selectedRemote,
  kumandalarList,
  piList,
  selectedPiId,
  setSelectedPiId,
  activeBtn,
  tempSignals,
  currentStep,
  isSignalReady,
  aktifMi,
  inputClass,
  labelClass,
  resetCaptureOnly,
  readIrSignal,
  cancelCapture,
}) => {
  return (
    <div className="flex flex-col justify-between p-7 lg:border-r lg:border-slate-800">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Bağlı Olduğu Kumanda *</label>

          <select
            name="remoteControlId"
            value={formData.remoteControlId || ""}
            onChange={handleChange}
            required
            disabled={captureMode || actionLoading}
            className={inputClass}
          >
            <option value="">Kumanda Profili Seçiniz...</option>

            {kumandalarList.map((kumanda) => (
              <option key={kumanda.id} value={kumanda.id}>
                {kumanda.kumandaMarkaModel} ({kumanda.cihazTipi})
              </option>
            ))}
          </select>

          {selectedRemote && (
            <p className="mt-1 text-xs text-slate-500">
              Seçili profil:{" "}
              <span className="text-slate-300">
                {selectedRemote.kumandaMarkaModel}
              </span>
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Sinyali Okuyacak Pi Cihazı *</label>

          <select
            value={selectedPiId}
            onChange={(e) => setSelectedPiId(e.target.value)}
            required
            disabled={captureMode || actionLoading}
            className={inputClass}
          >
            <option value="">IR Alıcısı Olan Cihazı Seçin...</option>

            {piList.map((pi) => (
              <option key={pi.id} value={pi.id}>
                {pi.cihazAdi} ({pi.ipAdresi})
              </option>
            ))}
          </select>

          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            Fiziksel kumandayı bu cihaza doğru tutacaksınız.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Seçilen Tuş</label>

            <input
              type="text"
              readOnly
              value={
                activeBtn
                  ? `${remoteButtonLabels[activeBtn] || activeBtn} / ${activeBtn}`
                  : "Görselden tuş seçin..."
              }
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 text-sm font-bold text-cyan-300 outline-none"
            />
          </div>

          <div>
            <label className={labelClass}>Okuma Durumu</label>

            <div
              className={`flex h-12 items-center rounded-2xl border px-4 text-sm font-bold ${
                isSignalReady
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                  : captureMode
                    ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-300"
                    : "border-slate-800 bg-slate-950/50 text-slate-500"
              }`}
            >
              {isSignalReady
                ? "Sinyal doğrulandı"
                : captureMode
                  ? `${tempSignals.length}/3 okuma alındı`
                  : "Beklemede"}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-950/40 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-100">Sinyal Öğretme</p>

              <p className="mt-1 text-xs text-slate-500">
                Aynı fiziksel tuşa toplam 3 kez basılmalı.
              </p>
            </div>

            <button
              type="button"
              onClick={resetCaptureOnly}
              disabled={captureLoading || actionLoading || !activeBtn}
              className="flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-700 px-4 text-xs font-bold text-slate-300 transition-colors hover:border-red-400/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faRotateLeft} />
              Sıfırla
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`rounded-2xl border px-3 py-3 text-center text-xs font-bold ${
                  tempSignals.length >= step
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                    : captureMode && currentStep === step
                      ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
                      : "border-slate-700 bg-slate-900 text-slate-500"
                }`}
              >
                {tempSignals.length >= step ? (
                  <span className="inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faCheck} />
                    Okundu
                  </span>
                ) : (
                  `${step}. Okuma`
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={readIrSignal}
            disabled={
              captureLoading ||
              actionLoading ||
              !captureMode ||
              !activeBtn ||
              isSignalReady
            }
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-colors duration-200 hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {captureLoading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Sinyal bekleniyor
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSignal} />
                {captureMode ? `${currentStep}. Sinyali Oku` : "Tuş Seçin"}
              </>
            )}
          </button>
        </div>

        <div>
          <label className={labelClass}>Çözümlenen Raw Data</label>

          <textarea
            readOnly
            value={formData.rawDataJson || ""}
            rows="3"
            placeholder="3 okuma doğrulanınca otomatik dolacaktır..."
            className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 font-mono text-xs text-emerald-300 outline-none placeholder:text-slate-600"
          />
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 transition-colors duration-200 hover:border-cyan-400/30">
          <div>
            <p className="text-sm font-bold text-slate-100">Sinyal Durumu</p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                aktifMi
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {aktifMi ? "Aktif" : "Pasif"}
            </span>

            <input
              type="checkbox"
              name="aktifMi"
              checked={aktifMi}
              onChange={handleChange}
              disabled={actionLoading || captureLoading}
              className="h-5 w-5 accent-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </label>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={cancelCapture}
            disabled={captureLoading || actionLoading || !activeBtn}
            className="mr-auto h-11 text-sm font-bold text-red-400 underline underline-offset-4 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Öğretmeyi İptal Et
          </button>

          <button
            type="submit"
            disabled={
              actionLoading ||
              captureLoading ||
              captureMode ||
              !formData.rawDataJson
            }
            className="flex h-11 min-w-40 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-colors duration-200 hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionLoading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Kaydediliyor
              </>
            ) : (
              "Sinyali Kaydet"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LearningFormPanel;
