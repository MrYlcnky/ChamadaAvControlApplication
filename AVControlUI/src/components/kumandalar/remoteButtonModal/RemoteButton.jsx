import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { remoteButtonLabels } from "./remoteButtonConstants";

const RemoteButton = ({
  code,
  icon,
  text,
  iconClass = "text-slate-200",
  bg = "bg-slate-800",
  hoverBg = "hover:bg-slate-700",
  size = "h-12 w-12",
  customClass = "",
  rounded = "rounded-full",
  label,
  activeBtn,
  captureMode,
  captureLoading,
  actionLoading,
  handleRemoteButtonClick,
}) => {
  const isSelected = activeBtn === code;

  return (
    <button
      type="button"
      onClick={() => handleRemoteButtonClick(code)}
      disabled={captureLoading || actionLoading || (captureMode && !isSelected)}
      className={`group relative flex items-center justify-center border-2 shadow-inner transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${rounded} ${size} ${customClass} ${
        isSelected
          ? "border-cyan-400 bg-slate-700 ring-4 ring-cyan-500/30"
          : `border-slate-700 ${bg} ${hoverBg}`
      }`}
      title={label || remoteButtonLabels[code] || code}
    >
      {icon ? (
        <FontAwesomeIcon
          icon={icon}
          className={`${iconClass} text-lg transition-colors group-hover:text-white`}
        />
      ) : (
        <span
          className={`${iconClass} text-[11px] font-bold transition-colors group-hover:text-white`}
        >
          {text || code}
        </span>
      )}
    </button>
  );
};

export default RemoteButton;
