import {
  faChevronUp,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faVolumeHigh,
  faVolumeLow,
} from "@fortawesome/free-solid-svg-icons";

import RemoteButton from "./RemoteButton";
import DirectionButton from "./DirectionButton";
import { remoteButtonGroups } from "./remoteButtonConstants";

const StandardRemoteTemplate = ({
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
    <div className="relative z-20 flex w-64 flex-col items-center gap-6 rounded-[3rem] border border-slate-700 bg-slate-900 p-6 pb-10 shadow-2xl shadow-black">
      <div className="mb-5 h-2 w-16 rounded-full bg-slate-800" />

      <div className="flex w-full justify-between px-2">
        {remoteButtonGroups.top.map((button) => (
          <RemoteButton
            key={button.code}
            code={button.code}
            icon={button.icon}
            iconClass={button.iconClass}
            label={button.label}
            {...commonProps}
          />
        ))}
      </div>

      <div className="mt-5 flex w-full justify-between px-5">
        {remoteButtonGroups.menu.map((button) => (
          <RemoteButton
            key={button.code}
            code={button.code}
            icon={button.icon}
            size="h-10 w-10"
            label={button.label}
            {...commonProps}
          />
        ))}
      </div>

      <div className="relative mt-6 flex h-44 w-44 items-center justify-center rounded-full border-4 border-slate-700 bg-slate-800 shadow-inner">
        <DirectionButton
          code="UP"
          icon={faChevronUp}
          className="top-2"
          {...commonProps}
        />

        <DirectionButton
          code="DOWN"
          icon={faChevronDown}
          className="bottom-2"
          {...commonProps}
        />

        <DirectionButton
          code="LEFT"
          icon={faChevronLeft}
          className="left-2"
          {...commonProps}
        />

        <DirectionButton
          code="RIGHT"
          icon={faChevronRight}
          className="right-2"
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
          className={`flex h-16 w-16 items-center justify-center rounded-full border font-extrabold shadow-lg transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
            activeBtn === "OK"
              ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 ring-4 ring-cyan-500/30"
              : "border-slate-600 bg-slate-700 text-white hover:bg-slate-600"
          }`}
        >
          OK
        </button>
      </div>

      <div className="mt-5 flex w-full justify-center">
        {remoteButtonGroups.bottom.map((button) => (
          <RemoteButton
            key={button.code}
            code={button.code}
            icon={button.icon}
            size="h-10 w-10"
            label={button.label}
            {...commonProps}
          />
        ))}
      </div>

      <div className="mt-7 flex w-full justify-between px-5">
        <div className="flex flex-col items-center gap-1 rounded-full border border-slate-700 bg-slate-800 p-1">
          <RemoteButton
            code="VOL_UP"
            icon={faVolumeHigh}
            size="h-12 w-10"
            customClass="rounded-t-full rounded-b-md"
            {...commonProps}
          />

          <span className="text-[10px] font-bold text-slate-500">VOL</span>

          <RemoteButton
            code="VOL_DOWN"
            icon={faVolumeLow}
            size="h-12 w-10"
            customClass="rounded-b-full rounded-t-md"
            {...commonProps}
          />
        </div>

        <div className="flex flex-col items-center gap-1 rounded-full border border-slate-700 bg-slate-800 p-1">
          <RemoteButton
            code="CH_UP"
            icon={faChevronUp}
            size="h-12 w-10"
            customClass="rounded-t-full rounded-b-md"
            {...commonProps}
          />

          <span className="text-[10px] font-bold text-slate-500">CH</span>

          <RemoteButton
            code="CH_DOWN"
            icon={faChevronDown}
            size="h-12 w-10"
            customClass="rounded-b-full rounded-t-md"
            {...commonProps}
          />
        </div>
      </div>
    </div>
  );
};

export default StandardRemoteTemplate;
