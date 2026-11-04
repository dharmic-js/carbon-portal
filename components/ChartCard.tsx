import React from "react";
import Link from "next/link";
import { Info } from "lucide-react";

interface ChartCardProps {
  title: string;
  cellNumber?: number | string;
  sourceText?: string;
  insight?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
}

export default function ChartCard({
  title,
  cellNumber,
  sourceText,
  insight,
  children,
  headerAction,
  className = "",
}: ChartCardProps) {
  const defaultSource = cellNumber
    ? `Source: project notebook, Cell ${cellNumber} · Data: EDGAR_2026_GHG (European Commission JRC)`
    : sourceText || "Data: EDGAR_2026_GHG (European Commission JRC)";

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 transition hover:shadow-md ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
            {title}
          </h3>
          <Link
            href="/chart-sources"
            title="View chart lineage and source details"
            className="inline-flex items-center gap-1 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-full font-medium transition"
          >
            <Info className="w-3 h-3" />
            <span>ⓘ source</span>
          </Link>
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>

      {insight && (
        <div className="mb-4 p-3 bg-slate-50 border-l-4 border-teal-600 rounded-r text-sm text-slate-700 leading-relaxed">
          {insight}
        </div>
      )}

      <div className="my-2">{children}</div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="italic">{defaultSource}</span>
      </div>
    </div>
  );
}
