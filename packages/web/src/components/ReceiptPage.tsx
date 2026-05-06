"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseReceiptParams } from "@/lib/receipt";
import { DownloadButton } from "./DownloadButton";
import { ReceiptEditor } from "./ReceiptEditor";
import { getReceiptTemplate } from "./templates";

export function ReceiptPage() {
  const params = useSearchParams();
  const raw: Record<string, string> = {};
  params.forEach((value, key) => { raw[key] = value; });

  const initialData = useMemo(() => parseReceiptParams(raw), [params]);
  const [data, setData] = useState(initialData);

  const { Component: Receipt } = getReceiptTemplate(data.templateId);

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-zinc-950">
      <div className="mx-auto grid min-h-screen w-full min-w-0 max-w-7xl gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-6 lg:py-6">
        <main className="flex min-w-0 min-h-[60vh] flex-col items-center justify-center gap-4 overflow-x-hidden rounded-lg border border-[#d9cfbd] bg-[#fbfaf6] p-4 shadow-sm lg:p-8">
          <div className="flex w-full min-w-0 max-w-[380px] justify-center">
            <Receipt data={data} />
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
