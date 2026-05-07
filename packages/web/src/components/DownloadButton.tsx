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

      node.classList.add("is-exporting");
      const dataUrl = await domtoimage.toPng(node, {
        width: node.offsetWidth,
        height: node.offsetHeight,
        pixelRatio: 3,
        cacheBust: true,
      });
      node.classList.remove("is-exporting");

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.click();
    } catch (err) {
      document.getElementById("receipt")?.classList.remove("is-exporting");
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
      className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50"
    >
      <DownloadIcon />
      {loading ? "Generating..." : "Download PNG"}
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
      <path d="M7 1.75v7.5M7 9.25l-2.5-2.5M7 9.25l2.5-2.5M2.5 11.75h9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
