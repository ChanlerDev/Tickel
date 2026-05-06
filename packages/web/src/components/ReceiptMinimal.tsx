import { ReceiptData, formatTokens } from "@/lib/receipt";

interface Props {
  data: ReceiptData;
}

export function ReceiptMinimal({ data }: Props) {
  const hasBreakdown = data.models && data.models.length > 1;

  return (
    <div
      id="receipt"
      className="w-80 rounded-lg bg-white px-8 py-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-widest">Project</div>
          <div className="max-w-[180px] break-words text-lg font-semibold leading-tight">{data.title}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">{data.date}</div>
          {!hasBreakdown && (
            <div className="text-xs text-gray-400 mt-1">{data.model.split("-").slice(0,2).join("-")}</div>
          )}
        </div>
      </div>

      {hasBreakdown ? (
        <>
          {/* Multi-model: each model is a card with full detail */}
          {data.models!.map((m) => (
            <div key={m.model} className="mb-4 rounded-lg bg-gray-50 p-3">
              <div className="mb-2 break-words text-[11px] font-semibold">{m.model.replace(/^claude-/, "")}</div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div className="text-gray-400">Input</div>
                <div className="text-right font-mono">{formatTokens(m.in)}</div>
                <div className="text-gray-400">Output</div>
                <div className="text-right font-mono">{formatTokens(m.out)}</div>
                <div className="text-gray-400">Cache W</div>
                <div className="text-right font-mono">{formatTokens(m.cw)}</div>
                <div className="text-gray-400">Cache R</div>
                <div className="text-right font-mono">{formatTokens(m.cr)}</div>
              </div>
              <div className="flex justify-between mt-2 pt-1 border-t border-gray-200 text-xs font-semibold">
                <span>Subtotal</span>
                <span className="font-mono">${m.cost.toFixed(4)}</span>
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          {/* Single model: token grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: "Input",       value: formatTokens(data.inputTokens) },
              { label: "Output",      value: formatTokens(data.outputTokens) },
              { label: "Cache Write", value: formatTokens(data.cacheWriteTokens) },
              { label: "Cache Read",  value: formatTokens(data.cacheReadTokens) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-gray-50 p-3">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</div>
                <div className="text-base font-mono font-semibold mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Cost */}
      <div className="flex items-center justify-between rounded-lg bg-black px-4 py-3 text-white">
        <span className="text-sm">Total Cost</span>
        <span className="font-mono font-bold text-lg">${data.cost.toFixed(4)}</span>
      </div>

      <div className="text-center text-[9px] text-gray-300 mt-4 tracking-widest">
        tickel
      </div>
    </div>
  );
}
