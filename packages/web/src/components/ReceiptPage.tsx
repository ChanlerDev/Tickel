"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ModelBreakdown,
  ReceiptData,
  normalizeReceiptData,
  parseReceiptParams,
} from "@/lib/receipt";
import { ReceiptDefault } from "./ReceiptDefault";
import { ReceiptMinimal } from "./ReceiptMinimal";
import { DownloadButton } from "./DownloadButton";

const templateOptions = [
  { id: "default", label: "Thermal" },
  { id: "minimal", label: "Minimal" },
] as const;

function parseNumberInput(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, parsed);
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(4)}`;
}

function countActiveMetrics(data: ReceiptData): number {
  return [data.inputTokens, data.outputTokens, data.cacheWriteTokens, data.cacheReadTokens].filter(
    (value) => value > 0,
  ).length;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{children}</span>;
}

export function ReceiptPage() {
  const params = useSearchParams();

  const initialData = useMemo(() => {
    const raw: Record<string, string> = {};
    params.forEach((value, key) => {
      raw[key] = value;
    });
    return parseReceiptParams(raw);
  }, [params]);

  const [data, setData] = useState<ReceiptData>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const Receipt = data.templateId === "minimal" ? ReceiptMinimal : ReceiptDefault;
  const hasBreakdown = Boolean(data.models && data.models.length > 0);
  const activeMetrics = countActiveMetrics(data);
  const downloadFilename = `tickel-${data.date || "receipt"}.png`;

  const updateData = (updater: (current: ReceiptData) => ReceiptData) => {
    setData((current) => normalizeReceiptData(updater(current)));
  };

  const handleFieldChange =
    <K extends keyof ReceiptData>(field: K) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      updateData((current) => {
        if (
          field === "inputTokens" ||
          field === "outputTokens" ||
          field === "cacheWriteTokens" ||
          field === "cacheReadTokens" ||
          field === "cost"
        ) {
          return {
            ...current,
            [field]: parseNumberInput(value),
          } as ReceiptData;
        }

        return {
          ...current,
          [field]: value,
        } as ReceiptData;
      });
    };

  const handleModelBreakdownChange =
    (index: number, field: keyof ModelBreakdown) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      updateData((current) => ({
        ...current,
        models: (current.models ?? []).map((item, itemIndex) => {
          if (itemIndex !== index) {
            return item;
          }

          if (field === "model") {
            return { ...item, model: value };
          }

          return {
            ...item,
            [field]: parseNumberInput(value),
          };
        }),
      }));
    };

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1600px] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/55 shadow-2xl shadow-slate-950/50 backdrop-blur-2xl lg:flex-row">
        <section className="flex min-h-[58vh] flex-1 flex-col border-b border-white/10 px-6 py-6 sm:px-8 lg:min-h-full lg:border-b-0 lg:border-r lg:px-10 lg:py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-cyan-200">
                Tickel Workspace
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  左中区域只做一件事：把预览做得像成品。
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  左侧是主舞台，收据预览被抬到页面中心；右侧统一承接模板与参数控制。
                  这样视觉焦点更清晰，用户也更容易理解“看结果”与“调参数”的关系。
                </p>
              </div>
            </div>

            <div className="grid min-w-[260px] grid-cols-2 gap-3 self-stretch sm:min-w-[320px]">
              <StatCard label="Template" value={data.templateId} />
              <StatCard label="Total Cost" value={formatCurrency(data.cost)} />
              <StatCard label="Metrics" value={`${activeMetrics} active`} />
              <StatCard
                label="Mode"
                value={hasBreakdown ? `${data.models?.length ?? 0} models` : "Single model"}
              />
            </div>
          </div>

          <div className="mt-8 flex flex-1 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.03] px-4 py-8 sm:px-6 lg:px-10">
            <div className="relative flex w-full items-center justify-center overflow-auto rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.96))] px-6 py-10 shadow-inner shadow-black/20 sm:px-10">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:26px_26px] opacity-40" />
              <div className="relative z-10 flex flex-col items-center gap-5">
                <div className="origin-center transition-transform duration-300 sm:scale-110 lg:scale-[1.14]">
                  <Receipt data={data} />
                </div>
                <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950/70 p-3 shadow-lg shadow-slate-950/30">
                  <DownloadButton filename={downloadFilename} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="w-full shrink-0 bg-slate-950/35 px-6 py-6 sm:px-8 lg:w-[430px] lg:px-7 lg:py-8">
          <div className="flex h-full flex-col gap-6">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                Display Controls
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-white">右侧参数面板</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                页面层负责产品感，模板层负责卡片细节。这里把控制集中收口，避免打断左侧预览体验。
              </p>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto pr-1">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 text-sm font-semibold text-white">基础信息</div>
                <div className="space-y-4">
                  <label className="block space-y-2">
                    <FieldLabel>Template</FieldLabel>
                    <select
                      value={data.templateId}
                      onChange={handleFieldChange("templateId")}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                    >
                      {templateOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <FieldLabel>Project</FieldLabel>
                    <input
                      value={data.title}
                      onChange={handleFieldChange("title")}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
                      placeholder="Project title"
                    />
                  </label>

                  <label className="block space-y-2">
                    <FieldLabel>Date</FieldLabel>
                    <input
                      value={data.date}
                      onChange={handleFieldChange("date")}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                      placeholder="2026-05-07"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 text-sm font-semibold text-white">用量数据</div>
                {!hasBreakdown ? (
                  <div className="space-y-4">
                    <label className="block space-y-2">
                      <FieldLabel>Model</FieldLabel>
                      <input
                        value={data.model}
                        onChange={handleFieldChange("model")}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Input", field: "inputTokens", value: data.inputTokens },
                        { label: "Output", field: "outputTokens", value: data.outputTokens },
                        { label: "Cache W", field: "cacheWriteTokens", value: data.cacheWriteTokens },
                        { label: "Cache R", field: "cacheReadTokens", value: data.cacheReadTokens },
                      ].map((item) => (
                        <label key={item.field} className="block space-y-2">
                          <FieldLabel>{item.label}</FieldLabel>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.value}
                            onChange={handleFieldChange(item.field as keyof ReceiptData)}
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                          />
                        </label>
                      ))}
                    </div>

                    <label className="block space-y-2">
                      <FieldLabel>Total Cost</FieldLabel>
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={data.cost}
                        onChange={handleFieldChange("cost")}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(data.models ?? []).map((item, index) => (
                      <div
                        key={`${item.model}-${index}`}
                        className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                      >
                        <div className="mb-3 text-xs uppercase tracking-[0.22em] text-slate-400">
                          Model {index + 1}
                        </div>
                        <div className="space-y-3">
                          <input
                            value={item.model}
                            onChange={handleModelBreakdownChange(index, "model")}
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: "Input", field: "in", value: item.in },
                              { label: "Output", field: "out", value: item.out },
                              { label: "Cache W", field: "cw", value: item.cw },
                              { label: "Cache R", field: "cr", value: item.cr },
                              { label: "Cost", field: "cost", value: item.cost, step: "0.0001" },
                            ].map((metric) => (
                              <label key={metric.field} className="block space-y-2">
                                <FieldLabel>{metric.label}</FieldLabel>
                                <input
                                  type="number"
                                  min="0"
                                  step={metric.step ?? "1"}
                                  value={metric.value}
                                  onChange={handleModelBreakdownChange(
                                    index,
                                    metric.field as keyof ModelBreakdown,
                                  )}
                                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
