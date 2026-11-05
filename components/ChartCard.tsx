import React from "react";

interface ChartCardProps {
  title: string;
  cellNumber?: number | string;
  showCellNumber?: boolean;
  sourceText?: string;
  insight?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
}

export default function ChartCard({
  title,
  cellNumber,
  showCellNumber = true,
  sourceText,
  insight,
  children,
  headerAction,
  className = "",
}: ChartCardProps) {
  const defaultSource = sourceText
    ? sourceText
    : cellNumber && showCellNumber
    ? `Source: project notebook, Cell ${cellNumber} · Data: EDGAR_2026_GHG (European Commission JRC)`
    : "Data: EDGAR_2026_GHG (European Commission JRC)";

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-6 transition hover:shadow-md ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
            {title}
          </h3>
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

