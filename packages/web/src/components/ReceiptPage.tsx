"use client";

import { useSearchParams } from "next/navigation";
import { parseReceiptParams } from "@/lib/receipt";
import { ReceiptDefault } from "./ReceiptDefault";
import { ReceiptMinimal } from "./ReceiptMinimal";
import { DownloadButton } from "./DownloadButton";

export function ReceiptPage() {
  const params = useSearchParams();
  const raw: Record<string, string> = {};
  params.forEach((value, key) => { raw[key] = value; });

  const data = parseReceiptParams(raw);

  const Receipt = data.templateId === "minimal" ? ReceiptMinimal : ReceiptDefault;

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Receipt data={data} />
      <DownloadButton filename={`tickel-${data.date}.png`} />
    </div>
  );
}
