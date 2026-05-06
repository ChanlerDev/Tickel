import { ReceiptData } from "@/lib/receipt";
import { ReceiptTemplate } from "./templates";

interface Props {
  data: ReceiptData;
  template: ReceiptTemplate;
}

export function ReceiptFrame({ data, template }: Props) {
  const Receipt = template.Component;

  return (
    <div
      id="receipt"
      className="receipt-frame overflow-hidden"
      style={{
        width: "100%",
        maxWidth: `min(${template.width}px, calc(100vw - 64px))`,
        ["--receipt-width" as string]: `${template.width}px`,
      }}
    >
      <Receipt data={data} />
    </div>
  );
}
