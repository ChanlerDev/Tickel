"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseReceiptParams } from "@/lib/receipt";
import { DownloadButton } from "./DownloadButton";
import { ReceiptEditor } from "./ReceiptEditor";
import { ReceiptFrame } from "./ReceiptFrame";
import { getReceiptTemplate } from "./templates";

export function ReceiptPage() {
  const params = useSearchParams();
  const raw: Record<string, string> = {};
  params.forEach((value, key) => { raw[key] = value; });

  const initialData = useMemo(() => parseReceiptParams(raw), [params]);
  const [data, setData] = useState(initialData);

  const template = getReceiptTemplate(data.templateId);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex h-12 items-center border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-sm lg:px-6">
        <span className="text-sm font-semibold tracking-tight text-zinc-900">Tickel</span>
      </header>

      {/* Main grid */}
      <div className="mx-auto grid w-full max-w-[1320px] gap-0 lg:grid-cols-[1fr_340px] lg:min-h-[calc(100vh-48px)]">
        {/* Preview stage */}
        <main className="flex flex-col items-center justify-center gap-5 px-6 py-10 lg:px-12 lg:py-16">
          <div className="flex w-full justify-center">
            <ReceiptFrame data={data} template={template} />
          </div>
          <DownloadButton filename={`tickel-${safeFilenamePart(data.date)}.png`} />
        </main>

        {/* Control panel */}
        <aside className="border-t border-zinc-200 bg-white lg:border-l lg:border-t-0 lg:overflow-y-auto lg:h-[calc(100vh-48px)] lg:sticky lg:top-12">
          <ReceiptEditor data={data} onChange={setData} />
        </aside>
      </div>
    </div>
  );
}

function safeFilenamePart(value: string): string {
  return value.replace(/[^a-z0-9-]/gi, "-") || "receipt";
}
