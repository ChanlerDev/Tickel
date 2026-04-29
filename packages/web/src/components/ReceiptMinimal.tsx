import { ReceiptData, formatTokens } from "@/lib/receipt";

interface Props {
  data: ReceiptData;
}

export function ReceiptMinimal({ data }: Props) {
  return (
    <div
      id="receipt"
      className="bg-white rounded-2xl w-80 px-8 py-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-widest">Project</div>
          <div className="text-lg font-semibold">{data.title}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">{data.date}</div>
          <div className="text-xs text-gray-400 mt-1">{data.model.split("-").slice(0,2).join("-")}</div>
        </div>
      </div>

      {/* Token grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Input",       value: formatTokens(data.inputTokens) },
          { label: "Output",      value: formatTokens(data.outputTokens) },
          { label: "Cache Write", value: formatTokens(data.cacheWriteTokens) },
          { label: "Cache Read",  value: formatTokens(data.cacheReadTokens) },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</div>
            <div className="text-base font-mono font-semibold mt-0.5">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Cost */}
      <div className="bg-black text-white rounded-xl px-4 py-3 flex justify-between items-center">
        <span className="text-sm">Total Cost</span>
        <span className="font-mono font-bold text-lg">${data.cost.toFixed(4)}</span>
      </div>

      <div className="text-center text-[9px] text-gray-300 mt-4 tracking-widest">
        tickel
      </div>
    </div>
  );
}
