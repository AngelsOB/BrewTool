import { getBjcpCategories } from "../../../utils/bjcp";

export default function StyleSelector({
  bjcpStyleLabel,
  bjcpStyleCode,
  onChangeStyleCode,
  showStyleInfo,
  onToggleStyleInfo,
}: {
  bjcpStyleLabel: string;
  bjcpStyleCode: string;
  onChangeStyleCode: (code: string) => void;
  showStyleInfo: boolean;
  onToggleStyleInfo: () => void;
}) {
  return (
    <div className="sm:col-span-2">
      <div className="relative">
        <div className="w-full rounded-md border border-transparent px-1 py-1 text-left hover:bg_white/5">
          <span className="text-sm text-white/60">
            Style: <span className="italic">{bjcpStyleLabel || "None"}</span>
          </span>
        </div>
        <select
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          value={bjcpStyleCode}
          onChange={(e) => onChangeStyleCode(e.target.value)}
          aria-label="Select BJCP style"
        >
          <option value="">None</option>
          {getBjcpCategories().map((cat) => (
            <optgroup key={cat.code} label={`${cat.code}. ${cat.name}`}>
              {cat.styles.map((s) => (
                <option
                  key={s.code}
                  value={s.code}
                >{`${s.code}. ${s.name}`}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="mt-1">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs text-white/40 hover:bg-white/20 shadow-lg shadow-black/30 hover:shadow-sm"
          onClick={onToggleStyleInfo}
        >
          {showStyleInfo ? "Hide Style Info" : "Open Style Info"}
        </button>
      </div>
    </div>
  );
}
