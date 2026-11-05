"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  TrendingUp,
  Globe2,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  Info,
} from "lucide-react";

import marketsData from "@/data/markets.json";
import ChartCard from "@/components/ChartCard";
import PlotlyChart from "@/components/PlotlyChart";
import KpiCards, { KpiCardItem } from "@/components/KpiCards";
import {
  fetchEconomicContext,
  EconomicContextResult,
  EconomicContextRow,
} from "@/lib/worldBank";
import { formatUSDbn, formatMt, formatPct, formatNumber } from "@/lib/format";

export default function MarketsPage() {
  const profiles = marketsData.cell12_market_profiles;
  const scorecard = marketsData.cell14_scorecard;
  const outlook = marketsData.cell15_outlook;
  const exposure = marketsData.cell16_exposure;

  // --- 1. World Bank State (Cell 13) ---
  const [econData, setEconData] = useState<EconomicContextResult>({
    source: "Stored values (World Bank 2023)",
    isLive: false,
    rows: marketsData.cell13_economic_context.rows,
  });
  const [loadingEcon, setLoadingEcon] = useState(true);

  useEffect(() => {
    fetchEconomicContext().then((res) => {
      setEconData(res);
      setLoadingEcon(false);
    });
  }, []);

  // --- 2. Market Profiles Table State (Cell 12) ---
  const [profileSearch, setProfileSearch] = useState("");
  const [profileSortKey, setProfileSortKey] = useState<string>("Emissions_2025_Mt");
  const [profileSortAsc, setProfileSortAsc] = useState<boolean>(false);

  const filteredProfiles = useMemo(() => {
    let list = [...profiles];
    if (profileSearch.trim()) {
      const q = profileSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.Country.toLowerCase().includes(q) ||
          p.Sector.toLowerCase().includes(q)
      );
    }
    list.sort((a: any, b: any) => {
      const valA = a[profileSortKey];
      const valB = b[profileSortKey];
      if (typeof valA === "string") {
        return profileSortAsc
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return profileSortAsc ? valA - valB : valB - valA;
    });
    return list;
  }, [profiles, profileSearch, profileSortKey, profileSortAsc]);

  // --- 3. Economic Context Table Sorting (Cell 13) ---
  const [econSortKey, setEconSortKey] = useState<string>("t_per_person");
  const [econSortAsc, setEconSortAsc] = useState<boolean>(false);

  const sortedEconRows = useMemo(() => {
    const list = [...econData.rows];
    list.sort((a: any, b: any) => {
      const valA = a[econSortKey];
      const valB = b[econSortKey];
      if (typeof valA === "string") {
        return econSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return econSortAsc ? valA - valB : valB - valA;
    });
    return list;
  }, [econData.rows, econSortKey, econSortAsc]);

  // --- 4. Chart B1: Priority Matrix (Cell 14) ---
  const quadrantColours: Record<string, string> = scorecard.quadrant_colours;
  const sortedScorecard = [...scorecard.rows].sort(
    (a, b) => b.Priority_Score - a.Priority_Score
  );
  const top5Markets = sortedScorecard.slice(0, 5);

  const quadrants = [
    "Priority: large & growing",
    "Transition risk: large, flat/declining",
    "Emerging: small & growing",
    "Mature: small & declining",
  ];

  const quadrantCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    quadrants.forEach((q) => (counts[q] = 0));
    scorecard.rows.forEach((r) => {
      if (counts[r.Quadrant] !== undefined) counts[r.Quadrant]++;
    });
    return counts;
  }, [scorecard.rows]);

  const b1Traces: Plotly.Data[] = quadrants.map((q) => {
    const qRows = scorecard.rows.filter((r) => r.Quadrant === q);
    return {
      type: "scatter",
      mode: "markers",
      name: q,
      x: qRows.map((r) => r.Growth_10y_pct),
      y: qRows.map((r) => r.Emissions_2025_Mt),
      text: qRows.map((r) => r.Market),
      customdata: qRows.map((r) => [
        r.Priority_Score.toFixed(1),
        r.Peak_Year,
        r.Growth_10y_pct.toFixed(1),
        r.Emissions_2025_Mt.toFixed(1),
      ]),
      hovertemplate:
        "<b>%{text}</b><br>" +
        "Priority Score: %{customdata[0]}<br>" +
        "10-yr CAGR: %{customdata[2]}%<br>" +
        "2025 Emissions: %{customdata[3]} Mt<br>" +
        "Peak Year: %{customdata[1]}<extra></extra>",
      marker: {
        color: quadrantColours[q],
        size: qRows.map((r) => Math.max(14, r.Priority_Score * 0.45)),
        opacity: 0.85,
        line: { color: "#ffffff", width: 1.5 },
      },
    };
  });

  // Top 5 market annotations
  const annotations: any[] = top5Markets.map((m, i) => ({
    x: m.Growth_10y_pct,
    y: Math.log10(m.Emissions_2025_Mt),
    text: `#${i + 1} ${m.Market}`,
    showarrow: true,
    arrowhead: 2,
    arrowsize: 1,
    arrowwidth: 1.5,
    arrowcolor: "#475569",
    ax: 0,
    ay: -32,
    bgcolor: "rgba(255, 255, 255, 0.95)",
    bordercolor: "#cbd5e1",
    borderwidth: 1,
    borderpad: 3,
    font: { size: 10, color: "#0f172a", family: "Inter, sans-serif" },
  }));

  // --- 5. Carbon Exposure KPIs (Cell 16) ---
  const exposureKpis: KpiCardItem[] = [
    {
      label: "Emissions Value Priced Today",
      value: formatUSDbn(exposure.total_now_usd_bn * 1000, 1),
      subtext: "Effective revenue at existing national carbon tax/ETS levels",
      color: "#164e63",
    },
    {
      label: "Potential Value Under Net Zero",
      value: formatUSDbn(exposure.total_nze_usd_bn * 1000, 1),
      subtext: "IEA NZE scenario (US$ 180 adv / US$ 125 emerging)",
      color: "#365314",
    },
    {
      label: "Largest Repricing Risk Market",
      value: `${exposure.top_gap.Country} – ${exposure.top_gap.Sector}`,
      subtext: `Repricing gap: ${formatUSDbn(exposure.top_gap.Repricing_Gap_USD_bn * 1000, 1)}`,
      color: "#C0392B",
      badge: "High Exposure",
      badgeColor: "red",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider">
          <span>Part B · Market Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Market Intelligence & Priority Scorecard
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-4xl leading-relaxed">
          Screening 33 country–sector markets through economic intensity, 2030 trajectory gaps,
          carbon repricing exposure, and a composite multi-factor scorecard.
        </p>
      </div>

      {/* 📊 CHART B1: Market Priority Matrix */}
      <section className="space-y-4">
        <ChartCard
          title="Chart B1: Market Priority Matrix — Growth vs Size with Priority Bubbles"
          sourceText="Data: EDGAR_2026_GHG (European Commission JRC) & World Bank Open Data · Priority score = 40% size + 30% growth + 15% near peak + 15% emissions per US$ GDP"
          insight="Markets in the upper-right quadrant ('Priority: large & growing', led by China and India power and industry) combine high absolute volume with expanding trajectories, demanding immediate capital intervention before fossil lock-in."
        >
          <div className="space-y-6">
            <div className="h-[520px]">
              <PlotlyChart
                data={b1Traces}
                layout={{
                  height: 500,
                  margin: { l: 65, r: 30, t: 30, b: 70 },
                  xaxis: {
                    title: { text: "10-Year Growth Rate (% / year, CAGR 2015–2025)" },
                    zeroline: false,
                  },
                  yaxis: {
                    title: { text: "2025 Emissions (Mt CO₂e, Log Scale)" },
                    type: "log",
                    autorange: true,
                  },
                  shapes: [
                    // Horizontal threshold line
                    {
                      type: "line",
                      xref: "paper",
                      x0: 0,
                      x1: 1,
                      yref: "y",
                      y0: scorecard.size_threshold_mt,
                      y1: scorecard.size_threshold_mt,
                      line: { color: "#94a3b8", width: 1.5, dash: "dash" as any },
                    },
                    // Vertical threshold line
                    {
                      type: "line",
                      xref: "x",
                      x0: 0.5,
                      x1: 0.5,
                      yref: "paper",
                      y0: 0,
                      y1: 1,
                      line: { color: "#94a3b8", width: 1.5, dash: "dash" as any },
                    },
                  ],
                  annotations,
                  showlegend: true,
                  legend: {
                    orientation: "h",
                    x: 0.5,
                    xanchor: "center",
                    y: -0.22,
                  },
                }}
              />
            </div>

            {/* Quadrant Explainers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {quadrants.map((q) => {
                const color = (quadrantColours as any)[q];
                const count = quadrantCounts[q] || 0;
                const desc = (scorecard.actions as any)[q] || "";
                return (
                  <div
                    key={q}
                    className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1.5"
                    style={{ borderLeft: `4px solid ${color}` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{q}</span>
                      <span
                        className="text-[11px] font-extrabold px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: color }}
                      >
                        {count} markets
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">{desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartCard>

        {/* Priority Scorecard Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Priority Scorecard (All 33 Markets)
              </h3>
              <p className="text-xs text-slate-500">
                Ranked by multi-criteria priority score · Data: EDGAR_2026_GHG & World Bank
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Showing 33 markets
            </span>
          </div>

          <div className="overflow-x-auto table-scrollbar max-h-96">
            <table className="min-w-full text-xs text-left divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0 z-10 font-semibold text-slate-700">
                <tr>
                  <th className="py-2 px-3">Rank</th>
                  <th className="py-2 px-3">Market</th>
                  <th className="py-2 px-3 text-right">2025 Mt</th>
                  <th className="py-2 px-3 text-right">10-yr CAGR</th>
                  <th className="py-2 px-3 text-center">Peak Year</th>
                  <th className="py-2 px-3 text-right">Score</th>
                  <th className="py-2 px-3">Quadrant</th>
                  <th className="py-2 px-3">Recommended Stance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedScorecard.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-3 font-mono font-bold text-slate-600">
                      #{idx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {r.Market}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {r.Emissions_2025_Mt.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {r.Growth_10y_pct > 0 ? "+" : ""}
                      {r.Growth_10y_pct.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600">
                      {r.Peak_Year}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-teal-800">
                      {r.Priority_Score.toFixed(1)}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white whitespace-nowrap"
                        style={{ backgroundColor: quadrantColours[r.Quadrant] }}
                      >
                        {r.Quadrant}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 max-w-xs truncate">
                      {r.Recommended_Stance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 1. Market Profiles (Cell 12) */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Market Profiles (33 Markets)
            </h3>
            <p className="text-xs text-slate-500">
              Decadal growth, volatility & linear 2030 forecast · Data: EDGAR_2026_GHG (European Commission JRC)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search market..."
                value={profileSearch}
                onChange={(e) => setProfileSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 w-48 sm:w-60"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto table-scrollbar max-h-96">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10 font-semibold text-slate-700">
              <tr>
                <th
                  onClick={() => {
                    setProfileSortKey("Country");
                    setProfileSortAsc(!profileSortAsc);
                  }}
                  className="py-2 px-3 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Market</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setProfileSortKey("Emissions_2025_Mt");
                    setProfileSortAsc(!profileSortAsc);
                  }}
                  className="py-2 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>2025 Mt</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setProfileSortKey("Growth_10y_pct");
                    setProfileSortAsc(!profileSortAsc);
                  }}
                  className="py-2 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>10-yr Growth</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setProfileSortKey("Peak_Year");
                    setProfileSortAsc(!profileSortAsc);
                  }}
                  className="py-2 px-3 text-center cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Peak Year</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setProfileSortKey("Below_Peak_pct");
                    setProfileSortAsc(!profileSortAsc);
                  }}
                  className="py-2 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>% Below Peak</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setProfileSortKey("Volatility_pct");
                    setProfileSortAsc(!profileSortAsc);
                  }}
                  className="py-2 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Volatility</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setProfileSortKey("Forecast_2030_Mt");
                    setProfileSortAsc(!profileSortAsc);
                  }}
                  className="py-2 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>2030 Forecast</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2 px-3">Momentum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProfiles.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-2 px-3 font-semibold text-slate-900">
                    {p.Country} – <span className="text-slate-600 font-normal">{p.Sector}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-medium">
                    {p.Emissions_2025_Mt.toFixed(1)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    <span
                      className={
                        p.Growth_10y_pct > 0 ? "text-amber-700" : "text-emerald-700 font-medium"
                      }
                    >
                      {p.Growth_10y_pct > 0 ? "+" : ""}
                      {p.Growth_10y_pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-600">
                    {p.Peak_Year}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    {p.Below_Peak_pct > 0 ? `-${p.Below_Peak_pct.toFixed(1)}%` : "At peak"}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    {p.Volatility_pct.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                    {p.Forecast_2030_Mt.toFixed(1)} Mt
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        p.Momentum.includes("Declining")
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : p.Momentum.includes("Rising fast")
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {p.Momentum}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Fair Comparison (World Bank API, Cell 13) */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-teal-700" />
              <span>Fair Comparison: Intensity Per Person & Per Dollar GDP</span>
            </h3>
            <p className="text-xs text-slate-500">
              Normalising emissions against demographic and economic scales · Data: World Bank Open Data API
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                econData.isLive
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  econData.isLive ? "bg-emerald-600 animate-pulse" : "bg-slate-400"
                }`}
              />
              <span>{econData.source}</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto table-scrollbar">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th
                  onClick={() => {
                    setEconSortKey("Country");
                    setEconSortAsc(!econSortAsc);
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Country</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setEconSortKey("Population");
                    setEconSortAsc(!econSortAsc);
                  }}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Population</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setEconSortKey("GDP_USD");
                    setEconSortAsc(!econSortAsc);
                  }}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>GDP (US$ bn)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setEconSortKey("Emissions_2025_Mt");
                    setEconSortAsc(!econSortAsc);
                  }}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>2025 Mt (3 Sectors)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setEconSortKey("t_per_person");
                    setEconSortAsc(!econSortAsc);
                  }}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Tonnes / Person</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setEconSortKey("kg_per_USD_GDP");
                    setEconSortAsc(!econSortAsc);
                  }}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>kg / US$ GDP</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedEconRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {row.Country}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {formatNumber(row.Population / 1e6, 1)}m
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    ${formatNumber(row.GDP_USD / 1e9, 0)} bn
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                    {row.Emissions_2025_Mt.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-800">
                    {row.t_per_person.toFixed(2)} t
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                    {row.kg_per_USD_GDP.toFixed(3)} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-500 italic pt-1">
          Note: Priority scores and matrix coordinates use the stored 2023 fallback values
          to maintain complete reproducibility with the reference project notebook.
        </p>
      </section>

      {/* 4. 2030 Trajectory Gap (Cell 15) */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              2030 Outlook: Business-As-Usual Trend vs 1.5 °C Pathway Gap
            </h3>
            <p className="text-xs text-slate-500">
              Calibrated to IPCC AR6 WGIII global pathway (-43% by 2030 vs 2019) · Data: EDGAR & IPCC AR6
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-2 text-right">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
              Total 2030 Deficit
            </span>
            <span className="text-xl font-black text-rose-900 font-mono">
              {formatMt(outlook.total_gap_mt, 1, "Mt/yr")}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto table-scrollbar">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-2.5 px-3">Sector</th>
                <th className="py-2.5 px-3 text-right">2019 Benchmark (Mt)</th>
                <th className="py-2.5 px-3 text-right">2025 Actual (Mt)</th>
                <th className="py-2.5 px-3 text-right">2030 Trend (BAU)</th>
                <th className="py-2.5 px-3 text-right text-emerald-800">
                  2030 1.5 °C Path
                </th>
                <th className="py-2.5 px-3 text-right font-bold text-rose-800">
                  Abatement Gap (Mt/yr)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {outlook.table.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                    {row.Sector}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600">
                    {row.Emissions_2019.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-800 font-medium">
                    {row.Emissions_2025.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-800 font-semibold">
                    {row.BAU_2030.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                    {row.Pathway_2030.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                    {row.Gap_Mt.toFixed(1)} Mt
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-lg text-sm text-teal-950 flex items-center justify-between">
          <span>
            The illustrative fund&apos;s default annual target (<strong>25.0 Mt/yr</strong>) represents{" "}
            <strong>{((25.0 / outlook.total_gap_mt) * 100).toFixed(2)}%</strong> of the total 2030 gap across the 11 nations.
          </span>
          <Link
            href="/simulator"
            className="text-xs font-semibold text-teal-800 underline hover:text-teal-900 ml-4 shrink-0"
          >
            Adjust Target in Simulator →
          </Link>
        </div>
      </section>

      {/* 5. Carbon Exposure Calculator (Cell 16) */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-900">
            Carbon Pricing Exposure & Repricing Risk
          </h3>
          <p className="text-xs text-slate-500">
            Annual carbon valuation of emissions under today&apos;s policies vs IEA Net Zero (NZE) · Data: World Bank & IEA WEO 2025
          </p>
        </div>

        <KpiCards cards={exposureKpis} columns={3} />

        <div className="overflow-x-auto table-scrollbar max-h-96">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10 font-semibold text-slate-700">
              <tr>
                <th className="py-2 px-3">Market</th>
                <th className="py-2 px-3 text-right">Priced Today (US$ bn)</th>
                <th className="py-2 px-3 text-right">Announced Pledges (US$ bn)</th>
                <th className="py-2 px-3 text-right">Net Zero NZE (US$ bn)</th>
                <th className="py-2 px-3 text-right font-bold text-rose-700">
                  Repricing Gap (US$ bn)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {[...exposure.rows]
                .sort((a, b) => b.Repricing_Gap_USD_bn - a.Repricing_Gap_USD_bn)
                .map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                      {r.Country} – <span className="text-slate-600 font-normal">{r.Sector}</span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">
                      ${r.Current_USD_bn.toFixed(2)} bn
                    </td>
                    <td className="py-2 px-3 text-right text-teal-800 font-medium">
                      ${r["Announced pledges (IEA APS)"].toFixed(2)} bn
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-800 font-semibold">
                      ${r["Net zero (IEA NZE)"].toFixed(2)} bn
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-rose-700">
                      ${r.Repricing_Gap_USD_bn.toFixed(2)} bn
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-500 italic">
          Note: A value of $0.00 bn today indicates no effective economy-wide carbon tax or ETS pricing applied to that sector.
        </p>
      </section>
    </div>
  );
}
