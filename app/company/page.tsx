"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  TrendingDown,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";

import assumptionsData from "@/data/model_assumptions.json";
import marketsData from "@/data/markets.json";
import { computeCompanyLens } from "@/lib/model";
import KpiCards, { KpiCardItem } from "@/components/KpiCards";
import { formatUSDm, formatMt, formatPct } from "@/lib/format";

export default function CompanyLensPage() {
  const countries = Object.keys(assumptionsData.COUNTRY_INFO).sort();
  const sectors = ["Agriculture", "Industrial Combustion", "Power Industry"];
  const scenarios = Object.keys(assumptionsData.SCENARIO_PRICES);

  // Inputs
  const [companyName, setCompanyName] = useState<string>("Illustrative manufacturer");
  const [country, setCountry] = useState<string>("India");
  const [sector, setSector] = useState<string>("Industrial Combustion");
  const [emissionsMt, setEmissionsMt] = useState<number>(2.0);
  const [cutPct, setCutPct] = useState<number>(30);
  const [selectedScenario, setSelectedScenario] = useState<string>(
    "Announced pledges (IEA APS)"
  );

  // Compute outputs via model function
  const lens = useMemo(() => {
    return computeCompanyLens(
      companyName,
      country,
      sector,
      emissionsMt,
      cutPct,
      selectedScenario
    );
  }, [companyName, country, sector, emissionsMt, cutPct, selectedScenario]);

  const paceGap = lens.required_rate_pct - lens.national_cagr_pct;

  const kpis: KpiCardItem[] = [
    {
      label: "National Sector Context (2025)",
      value: formatMt(lens.national_2025_mt, 0, "Mt"),
      subtext: `10-yr CAGR: ${lens.national_cagr_pct > 0 ? "+" : ""}${lens.national_cagr_pct.toFixed(1)}%/yr (${lens.national_momentum})`,
      color: "#172554",
    },
    {
      label: "Company Required Pace",
      value: `${lens.required_rate_pct.toFixed(1)}%/yr`,
      subtext: `Compounded annual cut to hit -${cutPct}% by 2030 (over 5 years)`,
      color: "#164e63",
    },
    {
      label: "Decoupling Gap vs National Trend",
      value: `${paceGap > 0 ? "+" : ""}${paceGap.toFixed(1)} pts/yr`,
      subtext:
        paceGap < 0
          ? "Firm must cut emissions significantly faster than the national sector"
          : "Company target aligns closely with national sector trajectory",
      color: paceGap < 0 ? "#C0392B" : "#365314",
      badge: paceGap < 0 ? "Fast-Track Required" : "Aligned",
      badgeColor: paceGap < 0 ? "amber" : "green",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider">
          <span>Enterprise Strategic Lens</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Company Lens: Translating National Data to Enterprise Strategy
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-4xl leading-relaxed">
          National sector data describes the operating environment and carbon liability risk.
          Input your organisation&apos;s baseline footprint and 2030 targets to assess required pace,
          exposure under global carbon scenarios, and lowest-cost decarbonisation options.
        </p>
      </div>

      {/* Main Grid: Controls on left, Results on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Company Inputs Form (4 cols) */}
        <aside className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-slate-900">
              Company Parameters
            </h2>
          </div>

          {/* Company Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Country Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Country of Operations
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Primary Operating Sector
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Own Emissions */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Own Annual Footprint</span>
              <span className="font-mono font-bold text-teal-800">
                {emissionsMt.toFixed(1)} Mt CO₂e/yr
              </span>
            </div>
            <input
              type="number"
              step={0.1}
              min={0.1}
              max={100}
              value={emissionsMt}
              onChange={(e) => setEmissionsMt(parseFloat(e.target.value) || 0.1)}
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          {/* Reduction Target % by 2030 */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">2030 Reduction Target</span>
              <span className="font-mono font-bold text-teal-800">{cutPct}% cut</span>
            </div>
            <input
              type="range"
              min={5}
              max={80}
              step={5}
              value={cutPct}
              onChange={(e) => setCutPct(parseInt(e.target.value, 10))}
              className="w-full accent-teal-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-5%</span>
              <span>-40%</span>
              <span>-80%</span>
            </div>
          </div>

          {/* Technology Cost Scenario */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block">
              Intervention Cost Scenario
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {scenarios.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* Outputs (8 cols) - KPI cards and tables ONLY (no charts) */}
        <main className="lg:col-span-8 space-y-6">
          {/* Caption Box */}
          <div className="p-3.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="italic font-medium">
              &ldquo;Use national data as context; your own emissions come from your own GHG inventory.&rdquo;
            </span>
            <span className="text-slate-400 font-mono">GHG Protocol Lens</span>
          </div>

          {/* KPI Cards */}
          <KpiCards cards={kpis} columns={3} />

          {/* Table 1: Company's own carbon bill under the 3 scenarios */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Carbon Pricing Liability Across Scenarios
                </h3>
                <p className="text-xs text-slate-500">
                  Estimated annual carbon bill if {companyName}&apos;s {emissionsMt} Mt footprint is fully priced
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500">
                IEA & World Bank Scenarios
              </span>
            </div>

            <div className="overflow-x-auto table-scrollbar">
              <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Carbon Scenario</th>
                    <th className="py-2.5 px-3 text-right">Applicable Price ($/t)</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">
                      Annual Carbon Bill (US$ m/yr)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {lens.carbon_bill.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                        {b.Scenario}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        ${b["Carbon price (US$/t)"].toFixed(0)} / t
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-teal-900">
                        ${b["Company carbon bill (US$ m/yr)"].toFixed(1)}m / yr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Cheapest options for this country-sector */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Cheapest Decarbonisation Interventions in {country} – {sector}
                </h3>
                <p className="text-xs text-slate-500">
                  Ranked by net abatement cost per tonne avoided under {selectedScenario}
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500">
                Intervention Database
              </span>
            </div>

            <div className="overflow-x-auto table-scrollbar">
              <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Project Type</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">
                      Net Cost ($ / t avoided)
                    </th>
                    <th className="py-2.5 px-3 text-right">Capital Required ($ / tpa)</th>
                    <th className="py-2.5 px-3 text-center">Financial Viability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {lens.options.map((opt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                        {opt.Project}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          opt.Abatement_cost_per_t < 0
                            ? "text-emerald-700"
                            : "text-slate-900"
                        }`}
                      >
                        ${opt.Abatement_cost_per_t.toFixed(1)} / t
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        ${opt.Capex_per_tpa.toFixed(0)} / tpa
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            opt.Abatement_cost_per_t < 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {opt.Abatement_cost_per_t < 0
                            ? "Self-Financing (Net Benefit)"
                            : "Cost Accretive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

