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
      className="rounded-md bg-zinc-950 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
    >
      {loading ? "Generating..." : "Download PNG"}
    </button>
  );
}
