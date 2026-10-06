import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGamepad,
  faXmark,
  faSatelliteDish,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

import StandardRemoteTemplate from "../kumandalar/remoteButtonModal/StandardRemoteTemplate";
import FullRemoteTemplate from "../kumandalar/remoteButtonModal/FullRemoteTemplate";

import orchestrationService from "../../services/orchestrationService";

const KontrolPaneliKumandaModal = ({
  isOpen,
  kumanda,
  kullaniciId,
  onClose,
}) => {
  if (!isOpen || !kumanda) {
    return null;
  }

  return createPortal(
    <KontrolPaneliKumandaModalContent
      key={kumanda.remoteControlId}
      kumanda={kumanda}
      kullaniciId={kullaniciId}
      onClose={onClose}
    />,
    document.body,
  );
};

const KontrolPaneliKumandaModalContent = ({
  kumanda,
  kullaniciId,
  onClose,
}) => {
  const hedefler = Array.isArray(kumanda?.hedefler) ? kumanda.hedefler : [];

  const defaultTargetId =
    hedefler.length === 1 ? String(hedefler[0].irTransmitterId) : "";

  const [remoteTemplate, setRemoteTemplate] = useState("full");
  const [selectedTargetId, setSelectedTargetId] = useState(defaultTargetId);

  const [actionLoading, setActionLoading] = useState(false);
  const [activeBtn, setActiveBtn] = useState(null);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !actionLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [actionLoading, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleRemoteButtonClick = async (tusKodu) => {
    if (actionLoading) return;

    if (!selectedTargetId) {
      toast.warning("Önce IR hedefini seçmelisiniz.");
      return;
    }

    try {
      setActionLoading(true);
      setActiveBtn(tusKodu);

      await orchestrationService.kontrolPaneliKumandaTusGonder({
        remoteControlId: Number(kumanda.remoteControlId),
        irTransmitterId: Number(selectedTargetId),
        tusKodu,
        kullaniciId: Number(kullaniciId),
      });
    } catch (error) {
      toast.error(
        error.response?.data?.mesaj || "Kumanda komutu gönderilemedi.",
      );
    } finally {
      setActionLoading(false);

      setTimeout(() => {
        setActiveBtn(null);
      }, 150);
    }
  };

  const remoteCommonProps = {
    activeBtn,
    captureMode: false,
    captureLoading: false,
    actionLoading,
    handleRemoteButtonClick,
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        bg-slate-950/20
        p-1.5

        sm:p-3
      "
      role="dialog"
      aria-modal="true"
    >
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
        onClick={!actionLoading ? onClose : undefined}
      />

      {/* MODAL */}
      <div
        className="
          relative
          flex
          max-h-[calc(100dvh-12px)]
          w-full
          max-w-[680px]
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-cyan-400/10
          bg-slate-900
          shadow-2xl
          shadow-black/60

          sm:max-h-[calc(100dvh-24px)]
          sm:w-[calc(100vw-24px)]
          sm:rounded-[1.5rem]
        "
      >
        {/* ÜST RENKLİ ÇİZGİ */}
        <div className="h-[3px] shrink-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-500" />

        {/* HEADER */}
        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            gap-3
            border-b
            border-slate-800
            px-3
            py-2.5

            sm:px-4
            sm:py-3
          "
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-cyan-400/20
                bg-cyan-500/10
                text-cyan-300

                sm:h-10
                sm:w-10
              "
            >
              <FontAwesomeIcon icon={faGamepad} />
            </div>

            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-300/70 sm:text-[9px]">
                Kontrol Paneli Kumandası
              </p>

              <h3 className="truncate text-sm font-extrabold text-white sm:text-lg">
                {kumanda.kumandaMarkaModel}
              </h3>

              <p className="truncate text-[9px] text-slate-500 sm:text-[10px]">
                {kumanda.cihazTipi}

                {kumanda.protokolTipi ? ` • ${kumanda.protokolTipi}` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-slate-700
              bg-slate-950/60
              text-slate-400
              transition-colors

              hover:border-red-400/40
              hover:text-red-400

              disabled:cursor-not-allowed
              disabled:opacity-40

              sm:h-9
              sm:w-9
            "
            title="Kapat"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* TÜM MODAL İÇERİĞİ */}
        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            scrollbar-thin
            scrollbar-thumb-slate-700
            scrollbar-track-transparent

            md:grid
            md:grid-cols-[185px_minmax(0,1fr)]
            md:overflow-hidden
          "
        >
          {/* AYARLAR */}
          <div
            className="
              shrink-0
              border-b
              border-slate-800
              bg-slate-900/80
              p-2.5

              md:border-b-0
              md:border-r
              md:p-3
            "
          >
            <div
              className="
                grid
                grid-cols-1
                gap-2

                min-[430px]:grid-cols-2

                md:grid-cols-1
              "
            >
              {/* IR HEDEFİ */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="mb-2 flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faSatelliteDish}
                    className="text-[10px] text-cyan-400"
                  />

                  <h4 className="text-[11px] font-bold text-white">
                    IR Hedefi
                  </h4>
                </div>

                <select
                  value={selectedTargetId}
                  onChange={(event) => setSelectedTargetId(event.target.value)}
                  disabled={actionLoading}
                  className="
                    h-9
                    w-full
                    rounded-lg
                    border
                    border-slate-700
                    bg-slate-950
                    px-2
                    text-[10px]
                    text-slate-200
                    outline-none
                    transition

                    focus:border-cyan-500
                    focus:ring-2
                    focus:ring-cyan-500/10

                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <option value="">IR hedefi seçin</option>

                  {hedefler.map((hedef, index) => (
                    <option
                      key={`${hedef.irTransmitterId}-${index}`}
                      value={hedef.irTransmitterId}
                    >
                      {hedef.irTransmitterAdi}
                      {hedef.kaynakAdi ? ` - ${hedef.kaynakAdi}` : ""}
                      {hedef.bolgeAdi ? ` - ${hedef.bolgeAdi}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* GÖRÜNÜM */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                  Görünüm
                </p>

                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRemoteTemplate("standard")}
                    disabled={actionLoading}
                    className={`rounded-lg px-2 py-2 text-[9px] font-bold transition ${
                      remoteTemplate === "standard"
                        ? "bg-cyan-600 text-white"
                        : "border border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    Standart
                  </button>

                  <button
                    type="button"
                    onClick={() => setRemoteTemplate("full")}
                    disabled={actionLoading}
                    className={`rounded-lg px-2 py-2 text-[9px] font-bold transition ${
                      remoteTemplate === "full"
                        ? "bg-blue-600 text-white"
                        : "border border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    Gelişmiş
                  </button>
                </div>
              </div>
            </div>

            {hedefler.length === 0 && (
              <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/5 p-2">
                <p className="text-[9px] leading-4 text-red-300">
                  Bu kumanda için kullanılabilir IR hedefi bulunamadı.
                </p>
              </div>
            )}

            {actionLoading && (
              <div className="mt-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2">
                <p className="text-[9px] font-medium text-cyan-300">
                  IR komutu gönderiliyor...
                </p>
              </div>
            )}
          </div>

          {/* KUMANDA ALANI */}
          <div
            className="
              flex
              min-h-0
              w-full
              justify-center
              bg-slate-950
              px-2
              py-2

              sm:px-3
              sm:py-3

              md:overflow-hidden
            "
          >
            <div
              className="
                mx-auto
                origin-top

                [zoom:0.58]

                min-[360px]:[zoom:0.62]
                min-[400px]:[zoom:0.68]
                sm:[zoom:0.72]
                md:[zoom:0.76]
                lg:[zoom:0.80]

                [@media(max-height:850px)]:[zoom:0.72]
                [@media(max-height:760px)]:[zoom:0.64]
                [@media(max-height:680px)]:[zoom:0.56]
              "
            >
              {remoteTemplate === "standard" ? (
                <StandardRemoteTemplate {...remoteCommonProps} />
              ) : (
                <FullRemoteTemplate {...remoteCommonProps} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KontrolPaneliKumandaModal;
