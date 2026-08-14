import {
  faPowerOff,
  faVolumeXmark,
  faBackward,
  faForward,
  faPlay,
  faPause,
  faInfo,
  faRightFromBracket,
  faChevronUp,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

import RemoteButton from "./RemoteButton";
import DirectionButton from "./DirectionButton";

const FullRemoteTemplate = ({
  activeBtn,
  captureMode,
  captureLoading,
  actionLoading,
  handleRemoteButtonClick,
}) => {
  const commonProps = {
    activeBtn,
    captureMode,
    captureLoading,
    actionLoading,
    handleRemoteButtonClick,
  };

  return (
    <div className="relative z-20 flex w-[280px] shrink-0 flex-col items-center rounded-[2rem] border border-slate-600 bg-gradient-to-b from-[#2a2c33] to-[#1a1c23] p-5 pb-8 shadow-2xl">
      <div className="mb-5 flex w-full justify-between px-2">
        <RemoteButton
          code="POWER"
          icon={faPowerOff}
          bg="bg-red-600"
          hoverBg="hover:bg-red-500"
          iconClass="text-white"
          size="w-10 h-10"
          {...commonProps}
        />

        <RemoteButton
          code="MUTE"
          icon={faVolumeXmark}
          size="w-10 h-10"
          {...commonProps}
        />
      </div>

      <div className="mb-5 flex w-full justify-between px-1">
        <RemoteButton
          code="RED"
          bg="bg-red-500"
          hoverBg="hover:bg-red-400"
          size="w-[50px] h-6"
          rounded="rounded-md"
          {...commonProps}
        />

        <RemoteButton
          code="GREEN"
          bg="bg-emerald-500"
          hoverBg="hover:bg-emerald-400"
          size="w-[50px] h-6"
          rounded="rounded-md"
          {...commonProps}
        />

        <RemoteButton
          code="YELLOW"
          bg="bg-yellow-400"
          hoverBg="hover:bg-yellow-300"
          size="w-[50px] h-6"
          rounded="rounded-md"
          {...commonProps}
        />

        <RemoteButton
          code="BLUE"
          bg="bg-blue-500"
          hoverBg="hover:bg-blue-400"
          size="w-[50px] h-6"
          rounded="rounded-md"
          {...commonProps}
        />
      </div>

      <div className="mb-2 grid w-full grid-cols-4 gap-2 px-1">
        <RemoteButton
          code="RWD"
          icon={faBackward}
          size="w-full h-8"
          rounded="rounded-lg"
          {...commonProps}
        />

        <RemoteButton
          code="FWD"
          icon={faForward}
          size="w-full h-8"
          rounded="rounded-lg"
          {...commonProps}
        />

        <RemoteButton
          code="PLAY"
          icon={faPlay}
          size="w-full h-8"
          rounded="rounded-lg"
          {...commonProps}
        />

        <RemoteButton
          code="PAUSE"
          icon={faPause}
          size="w-full h-8"
          rounded="rounded-lg"
          {...commonProps}
        />
      </div>

      <div className="mb-6 grid w-full grid-cols-4 gap-2 px-1">
        <RemoteButton
          code="SUBTITLE"
          text="SUB"
          size="w-full h-8"
          rounded="rounded-lg"
          {...commonProps}
        />

        <RemoteButton
          code="TEXT"
          text="TXT"
          size="w-full h-8"
          rounded="rounded-lg"
          {...commonProps}
        />

        <RemoteButton
          code="RECALL"
          text="RCL"
          size="w-full h-8"
          rounded="rounded-lg"
          {...commonProps}
        />

        <RemoteButton
          code="AUDIO"
          text="AUD"
          size="w-full h-8"
          rounded="rounded-lg"
          {...commonProps}
        />
      </div>

      <div className="mb-3 flex w-full justify-between px-2">
        <RemoteButton
          code="MENU"
          text="MENU"
          size="w-10 h-10"
          {...commonProps}
        />

        <RemoteButton
          code="INFO"
          icon={faInfo}
          size="w-10 h-10"
          {...commonProps}
        />
      </div>

      <div className="relative mb-3 flex h-40 w-40 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-800 shadow-lg">
        <DirectionButton
          code="UP"
          icon={faChevronUp}
          className="top-1"
          {...commonProps}
        />

        <DirectionButton
          code="DOWN"
          icon={faChevronDown}
          className="bottom-1"
          {...commonProps}
        />

        <DirectionButton
          code="LEFT"
          icon={faChevronLeft}
          className="left-1"
          {...commonProps}
        />

        <DirectionButton
          code="RIGHT"
          icon={faChevronRight}
          className="right-1"
          {...commonProps}
        />

        <button
          type="button"
          onClick={() => handleRemoteButtonClick("OK")}
          disabled={
            captureLoading ||
            actionLoading ||
            (captureMode && activeBtn !== "OK")
          }
          className={`flex h-16 w-16 items-center justify-center rounded-full border border-slate-600 font-bold transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
            activeBtn === "OK"
              ? "bg-slate-700 text-cyan-400 ring-2 ring-cyan-500"
              : "bg-slate-700 text-white hover:bg-slate-600"
          }`}
        >
          OK
        </button>
      </div>

      <div className="mb-6 flex w-full justify-between px-2">
        <RemoteButton code="EPG" text="EPG" size="w-10 h-10" {...commonProps} />

        <RemoteButton
          code="EXIT"
          icon={faRightFromBracket}
          size="w-10 h-10"
          {...commonProps}
        />
      </div>

      <div className="mb-6 flex w-full items-center justify-between px-2">
        <div className="flex flex-col items-center rounded-full border border-slate-700 bg-slate-800">
          <RemoteButton
            code="VOL_UP"
            text="+"
            size="w-10 h-10"
            customClass="rounded-t-full rounded-b-none"
            {...commonProps}
          />

          <span className="py-1 text-[10px] font-bold text-slate-400">VOL</span>

          <RemoteButton
            code="VOL_DOWN"
            text="-"
            size="w-10 h-10"
            customClass="rounded-b-full rounded-t-none"
            {...commonProps}
          />
        </div>

        <div className="flex flex-col gap-3">
          <RemoteButton
            code="FAV"
            text="FAV"
            size="w-12 h-10"
            rounded="rounded-xl"
            {...commonProps}
          />

          <RemoteButton
            code="REC"
            text="REC"
            bg="bg-red-900"
            hoverBg="hover:bg-red-800"
            iconClass="text-red-400"
            size="w-12 h-10"
            rounded="rounded-xl"
            {...commonProps}
          />
        </div>

        <div className="flex flex-col items-center rounded-full border border-slate-700 bg-slate-800">
          <RemoteButton
            code="CH_UP"
            text="+"
            size="w-10 h-10"
            customClass="rounded-t-full rounded-b-none"
            {...commonProps}
          />

          <span className="py-1 text-[10px] font-bold text-slate-400">CH</span>

          <RemoteButton
            code="CH_DOWN"
            text="-"
            size="w-10 h-10"
            customClass="rounded-b-full rounded-t-none"
            {...commonProps}
          />
        </div>
      </div>

      <div className="mb-2 grid w-full grid-cols-3 gap-3 px-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <RemoteButton
            key={num}
            code={`NUM_${num}`}
            text={num.toString()}
            size="w-full h-10"
            rounded="rounded-lg"
            {...commonProps}
          />
        ))}

        <RemoteButton
          code="DTV_VCR"
          text="DTV"
          size="w-full h-10"
          rounded="rounded-lg"
          {...commonProps}
        />

        <RemoteButton
          code="NUM_0"
          text="0"
          size="w-full h-10"
          rounded="rounded-lg"
          {...commonProps}
        />

        <RemoteButton
          code="TV_RADIO"
          text="TV/R"
          size="w-full h-10"
          rounded="rounded-lg"
          {...commonProps}
        />
      </div>
    </div>
  );
};

export default FullRemoteTemplate;
