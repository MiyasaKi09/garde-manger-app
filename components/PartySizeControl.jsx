// components/PartySizeControl.jsx
"use client";
import { useEffect, useState } from "react";

export default function PartySizeControl({ value, onChange }) {
  const [v, setV] = useState(value ?? 2);

  useEffect(() => {
    const saved = localStorage.getItem("myko.partySize");
    if (saved) {
      const n = parseInt(saved, 10);
      if (!Number.isNaN(n) && n > 0) {
        setV(n);
        onChange?.(n);
      }
    }
  }, []); // init

  useEffect(() => {
    localStorage.setItem("myko.partySize", String(v));
  }, [v]);

  return (
    <div className="flex items-center gap-3 rounded-xl border px-3 py-2 bg-white shadow-sm">
      <span className="text-sm text-gray-500">Nb personnes</span>
      <button
        onClick={() => { const n = Math.max(1, v - 1); setV(n); onChange?.(n); }}
        className="px-2 py-1 rounded-lg border hover:bg-gray-50"
        aria-label="Diminuer"
      >−</button>
      <input
        type="number"
        min={1}
        value={v}
        onChange={(e) => { const n = Math.max(1, parseInt(e.target.value || "1", 10)); setV(n); onChange?.(n); }}
        className="w-14 text-center border rounded-lg py-1"
      />
      <button
        onClick={() => { const n = v + 1; setV(n); onChange?.(n); }}
        className="px-2 py-1 rounded-lg border hover:bg-gray-50"
        aria-label="Augmenter"
      >+</button>
    </div>
  );
}
