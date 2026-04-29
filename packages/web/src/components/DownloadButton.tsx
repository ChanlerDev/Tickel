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

      const scale = 3; // retina quality
      const blob = await domtoimage.toBlob(node, {
        width: node.offsetWidth * scale,
        height: node.offsetHeight * scale,
        style: { transform: `scale(${scale})`, transformOrigin: "top left" },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
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
      className="mt-4 px-6 py-2 bg-black text-white text-sm rounded-full hover:bg-gray-800 disabled:opacity-50 transition-colors"
    >
      {loading ? "Generating..." : "Download PNG"}
    </button>
  );
}
