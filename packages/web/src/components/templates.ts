import { ReceiptData } from "@/lib/receipt";
import { ReceiptDefault } from "./ReceiptDefault";
import { ReceiptMinimal } from "./ReceiptMinimal";
import { ReceiptLedger } from "./ReceiptLedger";

export interface ReceiptTemplate {
  id: string;
  label: string;
  width: number;
  Component: (props: { data: ReceiptData }) => JSX.Element;
}

export const receiptTemplates: ReceiptTemplate[] = [
  { id: "default", label: "Thermal", width: 288, Component: ReceiptDefault },
  { id: "minimal", label: "Minimal", width: 320, Component: ReceiptMinimal },
  { id: "ledger", label: "Ledger", width: 380, Component: ReceiptLedger },
];

export function getReceiptTemplate(templateId: string): ReceiptTemplate {
  return receiptTemplates.find((template) => template.id === templateId) ?? receiptTemplates[0];
}
