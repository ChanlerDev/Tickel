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
    <form className="w-full rounded-lg border border-[#d9cfbd] bg-[#fffdf8] p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Details</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">Edit the receipt before export.</p>
        </div>
        <button
          type="button"
          onClick={addModel}
          className="shrink-0 rounded-md border border-[#cbbd9f] px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-[#f4efe5]"
        >
          Add
        </button>
      </div>

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

      <div className="mt-5 space-y-3">
        {models.map((model, index) => (
          <section key={`${model.agent}-${model.model}-${index}`} className="rounded-lg border border-[#e4d8c2] bg-[#fbf7ee] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-zinc-800">Model {index + 1}</div>
              <button
                type="button"
                onClick={() => removeModel(index)}
                disabled={models.length === 1}
                className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-[#eee5d5] disabled:cursor-not-allowed disabled:opacity-40"
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

const inputClass = "h-9 w-full rounded-md border border-[#d7c9ad] bg-white px-3 text-sm text-zinc-950 outline-none focus:border-[#7b6a4d]";
