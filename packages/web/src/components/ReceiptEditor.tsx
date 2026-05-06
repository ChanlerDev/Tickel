import { ReceiptData } from "@/lib/receipt";

interface Props {
  data: ReceiptData;
  onChange: (data: ReceiptData) => void;
}

type ModelField = "agent" | "model" | "in" | "out" | "cw" | "cr" | "cost";

export function ReceiptEditor({ data, onChange }: Props) {
  const models = data.models && data.models.length > 0
    ? data.models
    : [{
        agent: "claude-code",
        model: data.model,
        in: data.inputTokens,
        out: data.outputTokens,
        cw: data.cacheWriteTokens,
        cr: data.cacheReadTokens,
        cost: data.cost,
      }];

  function update(next: Partial<ReceiptData>): void {
    onChange({ ...data, ...next });
  }

  function updateModel(index: number, field: ModelField, value: string): void {
    const nextModels = models.map((model, i) => {
      if (i !== index) return model;
      return {
        ...model,
        [field]: field === "agent" || field === "model" ? value : parseNumber(value),
      };
    });
    onChange(normalizeFromModels(data, nextModels));
  }

  function addModel(): void {
    const nextModels = [
      ...models,
      { agent: "claude-code", model: "model", in: 0, out: 0, cw: 0, cr: 0, cost: 0 },
    ];
    onChange(normalizeFromModels(data, nextModels));
  }

  function removeModel(index: number): void {
    const nextModels = models.filter((_, i) => i !== index);
    onChange(normalizeFromModels(data, nextModels.length > 0 ? nextModels : models));
  }

  return (
    <form className="w-full max-w-3xl rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Receipt details</h2>
          <p className="text-xs text-zinc-500">Adjust the values before exporting the PNG.</p>
        </div>
        <button
          type="button"
          onClick={addModel}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Add model
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Project">
          <input value={data.title} onChange={(e) => update({ title: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Date">
          <input type="date" value={data.date} onChange={(e) => update({ date: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Template">
          <select value={data.templateId} onChange={(e) => update({ templateId: e.target.value })} className={inputClass}>
            <option value="default">Thermal</option>
            <option value="minimal">Minimal</option>
          </select>
        </Field>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[720px] w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="py-2 pr-2 font-medium">Agent</th>
              <th className="py-2 pr-2 font-medium">Model</th>
              <th className="py-2 pr-2 font-medium">Input</th>
              <th className="py-2 pr-2 font-medium">Output</th>
              <th className="py-2 pr-2 font-medium">Cache W</th>
              <th className="py-2 pr-2 font-medium">Cache R</th>
              <th className="py-2 pr-2 font-medium">Cost</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {models.map((model, index) => (
              <tr key={`${model.agent}-${model.model}-${index}`} className="border-b border-zinc-100">
                <td className="py-2 pr-2">
                  <input value={model.agent ?? ""} onChange={(e) => updateModel(index, "agent", e.target.value)} className={tableInputClass} />
                </td>
                <td className="py-2 pr-2">
                  <input value={model.model} onChange={(e) => updateModel(index, "model", e.target.value)} className={tableInputClass} />
                </td>
                <td className="py-2 pr-2">
                  <input inputMode="numeric" value={model.in} onChange={(e) => updateModel(index, "in", e.target.value)} className={tableInputClass} />
                </td>
                <td className="py-2 pr-2">
                  <input inputMode="numeric" value={model.out} onChange={(e) => updateModel(index, "out", e.target.value)} className={tableInputClass} />
                </td>
                <td className="py-2 pr-2">
                  <input inputMode="numeric" value={model.cw} onChange={(e) => updateModel(index, "cw", e.target.value)} className={tableInputClass} />
                </td>
                <td className="py-2 pr-2">
                  <input inputMode="numeric" value={model.cr} onChange={(e) => updateModel(index, "cr", e.target.value)} className={tableInputClass} />
                </td>
                <td className="py-2 pr-2">
                  <input inputMode="decimal" value={model.cost} onChange={(e) => updateModel(index, "cost", e.target.value)} className={tableInputClass} />
                </td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => removeModel(index)}
                    disabled={models.length === 1}
                    className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-medium text-zinc-600">
      {label}
      {children}
    </label>
  );
}

function normalizeFromModels(data: ReceiptData, models: ReceiptData["models"]): ReceiptData {
  const safeModels = models ?? [];
  return {
    ...data,
    model: safeModels.length === 1 ? safeModels[0].model : "mixed",
    inputTokens: sum(safeModels, "in"),
    outputTokens: sum(safeModels, "out"),
    cacheWriteTokens: sum(safeModels, "cw"),
    cacheReadTokens: sum(safeModels, "cr"),
    cost: sum(safeModels, "cost"),
    models: safeModels,
  };
}

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function sum(models: NonNullable<ReceiptData["models"]>, key: "in" | "out" | "cw" | "cr" | "cost"): number {
  return models.reduce((total, model) => total + model[key], 0);
}

const inputClass = "h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-zinc-500";
const tableInputClass = "h-8 w-full rounded border border-zinc-200 px-2 text-xs text-zinc-950 outline-none focus:border-zinc-500";
