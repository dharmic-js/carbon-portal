import React from "react";

export interface KpiCardItem {
  label: string;
  value: string;
  subtext?: string;
  color?: string; // hex or tailwind class
  badge?: string;
  badgeColor?: "green" | "red" | "amber" | "blue" | "slate";
}

interface KpiCardsProps {
  cards: KpiCardItem[];
  columns?: 2 | 3 | 4 | 6;
  className?: string;
}

export default function KpiCards({ cards, columns = 3, className = "" }: KpiCardsProps) {
  const colClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  }[columns];

  return (
    <div className={`grid ${colClass} gap-3 sm:gap-4 ${className}`}>
      {cards.map((card, idx) => {
        const accentColor = card.color || "#172554";
        return (
          <div
            key={idx}
            className="relative bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            style={{ borderTop: `4px solid ${accentColor}` }}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.label}
              </span>
              {card.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    card.badgeColor === "green"
                      ? "bg-emerald-100 text-emerald-800"
                      : card.badgeColor === "red"
                      ? "bg-rose-100 text-rose-800"
                      : card.badgeColor === "amber"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {card.badge}
                </span>
              )}
            </div>
            <div
              className="text-xl sm:text-2xl font-bold tracking-tight mt-1"
              style={{ color: accentColor }}
            >
              {card.value}
            </div>
            {card.subtext && (
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                {card.subtext}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

