"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseReceiptParams } from "@/lib/receipt";
import { ReceiptDefault } from "./ReceiptDefault";
import { ReceiptMinimal } from "./ReceiptMinimal";
import { DownloadButton } from "./DownloadButton";
import { ReceiptEditor } from "./ReceiptEditor";

export function ReceiptPage() {
  const params = useSearchParams();
  const raw: Record<string, string> = {};
  params.forEach((value, key) => { raw[key] = value; });

  const initialData = useMemo(() => parseReceiptParams(raw), [params]);
  const [data, setData] = useState(initialData);

  const Receipt = data.templateId === "minimal" ? ReceiptMinimal : ReceiptDefault;

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-zinc-50 px-4 py-8">
      <ReceiptEditor data={data} onChange={setData} />
      <div className="flex flex-col items-center gap-4">
        <Receipt data={data} />
        <DownloadButton filename={`tickel-${safeFilenamePart(data.date)}.png`} />
      </div>
    </div>
  );
}

function safeFilenamePart(value: string): string {
  return value.replace(/[^a-z0-9-]/gi, "-") || "receipt";
}
