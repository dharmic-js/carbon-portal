import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  BarChart3,
  SlidersHorizontal,
  ShieldAlert,
  Zap,
  Target,
  DollarSign,
  PieChart,
} from "lucide-react";

import partAData from "@/data/part_a_charts.json";
import marketsData from "@/data/markets.json";
import referenceData from "@/data/reference_results.json";
import { formatUSDbn, formatMt, formatPct } from "@/lib/format";
import KpiCards, { KpiCardItem } from "@/components/KpiCards";

export default function HomePage() {
  const cell4Kpis = partAData.cell4_sector_dashboard.kpis;
  const gapMt = marketsData.cell15_outlook.total_gap_mt;
  const defaultCase = referenceData.cases[0];

  const headlineCards: KpiCardItem[] = [
    {
      label: "Power Industry Share (2025)",
      value: formatPct(cell4Kpis.leading_share_pct, 1),
      subtext: `${formatMt(cell4Kpis.leading_value_mt, 0, "Mt")} of 15,807 Mt total across 11 countries`,
      color: "#F4A261",
      badge: "Largest Sector",
      badgeColor: "amber",
    },
    {
      label: "2030 Gap to 1.5 °C Pathway",
      value: formatMt(gapMt, 0, "Mt/yr"),
      subtext: "Required abatement across 3 sectors to track IPCC net-zero trajectory",
      color: "#C0392B",
      badge: "Target Deficit",
      badgeColor: "red",
    },
    {
      label: "Fund Abatement Impact",
      value: formatMt(defaultCase.kpi.Mt_avoided_per_year, 1),
      subtext: `Target: 25.0 Mt/yr (${((defaultCase.kpi.Mt_avoided_per_year / gapMt) * 100).toFixed(1)}% of 2030 gap)`,
      color: "#164e63",
      badge: "Target Met",
      badgeColor: "green",
    },
    {
      label: "Expected Fund Return (NPV)",
      value: formatUSDbn(defaultCase.kpi.NPV_USDm, 1),
      subtext: `ROI: ${defaultCase.kpi.ROI_pct.toFixed(0)}% · Payback: ${defaultCase.kpi.Payback_years.toFixed(1)} yrs under APS carbon prices`,
      color: "#365314",
      badge: "US$ 10 bn Fund",
      badgeColor: "blue",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-teal-600" />
          <span>Introduction to Python Programming (IPP)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Carbon Strategy & Investment Optimizer
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-3xl mx-auto">
          Global sectoral GHG emissions 1990–2025 → where should a US$10 bn climate fund invest?
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          <Link
            href="/history"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm hover:shadow transition"
          >
            <BarChart3 className="w-4 h-4 text-slate-300" />
            <span>Explore the history</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            href="/simulator"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium shadow-sm hover:shadow transition"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-200" />
            <span>Open the fund simulator</span>
            <ArrowRight className="w-4 h-4 text-teal-200" />
          </Link>
        </div>
      </div>

      {/* Headline KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Key Project Benchmarks
          </h2>
          <span className="text-xs text-slate-400">
            Computed from EDGAR_2026_GHG & LP Optimizer
          </span>
        </div>
        <KpiCards cards={headlineCards} columns={4} />
      </div>

      {/* Problem Statement Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-1">
            <Target className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest block">
              Approved Problem Statement
            </span>
            <blockquote className="text-lg sm:text-xl font-medium text-slate-900 leading-snug">
              &ldquo;How have emissions changed across Agriculture, Industrial Combustion and Power Industry in 11 countries from 1990 to 2025, and which sectors and countries should be prioritised for decarbonisation?&rdquo;
            </blockquote>
            <p className="text-sm text-slate-500 pt-1">
              Dataset: 1,188 observations spanning Australia, Brazil, Canada, China, Germany, India, Indonesia, Japan, South Africa, United Kingdom, and the United States across 36 years.
            </p>
          </div>
        </div>
      </div>

      {/* 3-Step Explainer */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          How the Analysis Works (3-Step Framework)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 font-bold text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>What happened (Part A)</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Historical analysis covering 1990–2025 across 8 visuals: sector concentration, national decoupling, treemaps, bumping ranks, diverging power trends, and the animated race.
            </p>
            <Link
              href="/history"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900 pt-2"
            >
              <span>View historical charts</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-900 font-bold text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>Which markets matter</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Market intelligence across 33 country–sector markets: compound annual growth rates, 2030 linear forecasts, World Bank economic intensity, carbon pricing exposure, and the priority matrix.
            </p>
            <Link
              href="/markets"
              className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-900 pt-2"
            >
              <span>Explore market matrix</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
              <span>Where to invest (Simulator)</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              A linear programming optimizer (HiGHS) deploying US$10 billion across 80 project options to maximise NPV or CO₂e avoided while respecting national, sector and technology risk caps.
            </p>
            <Link
              href="/simulator"
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900 pt-2"
            >
              <span>Run fund optimizer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mandatory Caveat Box */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 sm:p-6 text-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          <span>Core Analytical Caveat (MUST be kept in mind)</span>
        </div>
        <p className="text-xs sm:text-sm text-amber-950/80 leading-relaxed">
          <strong>National sector emissions are NOT company emissions.</strong> We use national emissions data exclusively to size markets, quantify macro decarbonisation opportunity, and identify systemic priority areas—never as an individual enterprise&apos;s direct operational footprint. The US$10 billion fund is illustrative, and non-power project costs are planning assumptions calibrated to IPCC AR6 bands. This tool is built for academic business analytics and is not financial or investment advice.
        </p>
      </div>
    </div>
  );
}

