import { ReceiptData } from "@/lib/receipt";
import { receiptTemplates } from "./templates";

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
    <form className="w-full rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">Details</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">Edit the data. Template style stays isolated.</p>
          </div>
          <button
            type="button"
            onClick={addModel}
            className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Add
          </button>
        </div>
      </div>

      <div className="grid gap-4 px-4 py-4">
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Receipt</div>
          <div className="grid gap-3">
            <Field label="Project">
              <input value={data.title} onChange={(e) => update({ title: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Date">
              <input type="date" value={data.date} onChange={(e) => update({ date: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Template">
              <select value={data.templateId} onChange={(e) => update({ templateId: e.target.value })} className={inputClass}>
                {receiptTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Usage</div>
          <div className="space-y-3">
            {models.map((model, index) => (
              <section key={`${model.agent}-${model.model}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-zinc-800">Model {index + 1}</div>
                  <button
                    type="button"
                    onClick={() => removeModel(index)}
                    disabled={models.length === 1}
                    className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-3">
                  <Field label="Agent">
                    <input value={model.agent ?? ""} onChange={(e) => updateModel(index, "agent", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Model">
                    <input value={model.model} onChange={(e) => updateModel(index, "model", e.target.value)} className={inputClass} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Input">
                      <input inputMode="numeric" value={model.in} onChange={(e) => updateModel(index, "in", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Output">
                      <input inputMode="numeric" value={model.out} onChange={(e) => updateModel(index, "out", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Cache W">
                      <input inputMode="numeric" value={model.cw} onChange={(e) => updateModel(index, "cw", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Cache R">
                      <input inputMode="numeric" value={model.cr} onChange={(e) => updateModel(index, "cr", e.target.value)} className={inputClass} />
                    </Field>
                  </div>
                  <Field label="Cost">
                    <input inputMode="decimal" value={model.cost} onChange={(e) => updateModel(index, "cost", e.target.value)} className={inputClass} />
                  </Field>
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-3 text-white">
          <div className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">Total</div>
          <div className="mt-1 font-mono text-2xl font-bold">${data.cost.toFixed(4)}</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-300">
            <span>Input {data.inputTokens.toLocaleString()}</span>
            <span>Output {data.outputTokens.toLocaleString()}</span>
            <span>Cache W {data.cacheWriteTokens.toLocaleString()}</span>
            <span>Cache R {data.cacheReadTokens.toLocaleString()}</span>
          </div>
        </div>
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

const inputClass = "h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-700";
