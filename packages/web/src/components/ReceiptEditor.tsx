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
    <form className="flex h-full flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
        <h2 className="text-[13px] font-semibold text-zinc-900">Parameters</h2>
        <button
          type="button"
          onClick={addModel}
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
        >
          + Model
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid gap-5">
          {/* Receipt meta */}
          <section className="grid gap-3">
            <SectionLabel>Receipt</SectionLabel>
            <Field label="Template">
              <select value={data.templateId} onChange={(e) => update({ templateId: e.target.value })} className={inputClass}>
                {receiptTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Project">
              <input value={data.title} onChange={(e) => update({ title: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Date">
              <input type="date" value={data.date} onChange={(e) => update({ date: e.target.value })} className={inputClass} />
            </Field>
          </section>

          {/* Model entries */}
          <section className="grid gap-3">
            <SectionLabel>Usage</SectionLabel>
            {models.map((model, index) => (
              <div key={index} className="rounded-md border border-zinc-150 bg-zinc-50/60 p-3">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-700">
                    {model.model || `Model ${index + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeModel(index)}
                    disabled={models.length === 1}
                    className="text-[11px] text-zinc-400 transition-colors hover:text-red-500 disabled:pointer-events-none disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <Field label="Agent">
                      <select
                        value={model.agent ?? ""}
                        onChange={(e) => updateModel(index, "agent", e.target.value)}
                        className={inputClass}
                      >
                        <option value="">claude-code</option>
                        <option value="codebuddy">CodeBuddy</option>
                        <option value="cursor">Cursor</option>
                        <option value="github-copilot">GitHub Copilot</option>
                      </select>
                    </Field>
                    <Field label="Model">
                      <input value={model.model} onChange={(e) => updateModel(index, "model", e.target.value)} className={inputClass} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
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
                  <Field label="Cost ($)">
                    <input inputMode="decimal" value={model.cost} onChange={(e) => updateModel(index, "cost", e.target.value)} className={inputClass} />
                  </Field>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* Footer total */}
      <div className="border-t border-zinc-100 px-5 py-3.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Total</span>
          <span className="font-mono text-lg font-bold text-zinc-900">${data.cost.toFixed(4)}</span>
        </div>
      </div>
    </form>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{children}</div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] font-medium text-zinc-500">{label}</span>
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

const inputClass = "h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20";
