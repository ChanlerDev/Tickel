import { Suspense } from "react";
import { ReceiptPage } from "@/components/ReceiptPage";

export default function Home() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-sm">Loading...</div>}>
      <ReceiptPage />
    </Suspense>
  );
}
