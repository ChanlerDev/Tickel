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
    <div className="min-h-screen bg-[#eef0f3] text-zinc-950">
      <div className="mx-auto grid min-h-screen w-full min-w-0 max-w-6xl gap-4 px-3 py-3 lg:grid-cols-[minmax(480px,1fr)_380px] lg:gap-5 lg:px-5 lg:py-5">
        <main className="flex min-h-[62vh] min-w-0 flex-col items-center justify-center gap-4 overflow-hidden rounded-lg border border-zinc-200 bg-[#f8f8f6] p-4 shadow-sm lg:min-h-[calc(100vh-2.5rem)] lg:p-8">
          <div className="flex w-full min-w-0 justify-center">
            <ReceiptFrame data={data} template={template} />
          </div>
          <DownloadButton filename={`tickel-${safeFilenamePart(data.date)}.png`} />
        </main>
        <aside className="min-w-0 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:overflow-y-auto">
          <ReceiptEditor data={data} onChange={setData} />
        </aside>
      </div>
    </div>
  );
}

function safeFilenamePart(value: string): string {
  return value.replace(/[^a-z0-9-]/gi, "-") || "receipt";
}
