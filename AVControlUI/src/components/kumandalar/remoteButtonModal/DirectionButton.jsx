import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const DirectionButton = ({
  code,
  icon,
  className = "",
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
      className={`absolute flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all duration-200 hover:bg-slate-700 hover:text-cyan-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${className} ${
        isSelected ? "bg-cyan-500/20 text-cyan-300 ring-2 ring-cyan-400" : ""
      }`}
    >
      <FontAwesomeIcon icon={icon} className="text-xl" />
    </button>
  );
};

export default DirectionButton;
