"use client";

import { useState } from "react";

interface Props {
  filename: string;
}

export function DownloadButton({ filename }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const domtoimage = (await import("dom-to-image-more")).default;
      const node = document.getElementById("receipt");
      if (!node) throw new Error("receipt element not found");

      const scale = 3;
      const blob = await domtoimage.toBlob(node, {
        width: node.offsetWidth * scale,
        height: node.offsetHeight * scale,
        style: { transform: `scale(${scale})`, transformOrigin: "top left" },
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed. See console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/30 transition-all hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Generating PNG..." : "Download PNG"}
    </button>
  );
}
