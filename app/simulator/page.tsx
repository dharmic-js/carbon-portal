"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Zap,
  Info,
  DollarSign,
  PieChart,
} from "lucide-react";

import assumptionsData from "@/data/model_assumptions.json";
import referenceData from "@/data/reference_results.json";
import ChartCard from "@/components/ChartCard";
import PlotlyChart from "@/components/PlotlyChart";
import KpiCards, { KpiCardItem } from "@/components/KpiCards";
import {
  buildProjects,
  optimisePortfolio,
  compareStrategies,
  computeRobustness,
  computeFrontier,
  computeLevers,
  generateRecommendations,
  ProjectRow,
  PlanRow,
  OptimisationResult,
  StrategyResult,
  RobustnessRow,
  FrontierRow,
  LeverRow,
} from "@/lib/model";
import {
  formatUSDbn,
  formatUSDm,
  formatMt,
  formatPct,
  formatNumber,
} from "@/lib/format";

export default function SimulatorPage() {
  const { defaults, control_ranges } = assumptionsData;

  // --- Controls State ---
  const [budgetUSDm, setBudgetUSDm] = useState<number>(defaults.BUDGET_USD_M);
  const [targetMt, setTargetMt] = useState<number>(defaults.TARGET_MT_PER_YEAR);
  const [scenario, setScenario] = useState<string>(defaults.SCENARIO);
  const [objective, setObjective] = useState<string>(defaults.OBJECTIVE);
  const [maxCountryShare, setMaxCountryShare] = useState<number>(defaults.MAX_COUNTRY_SHARE);
  const [minSectorShare, setMinSectorShare] = useState<number>(defaults.MIN_SECTOR_SHARE);
  const [maxProjectShare, setMaxProjectShare] = useState<number>(defaults.MAX_PROJECT_SHARE);

  // Loading & Async states
  const [isPending, startTransition] = useTransition();
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isFrontierLoading, setIsFrontierLoading] = useState<boolean>(false);
  const [showAllMaccProjects, setShowAllMaccProjects] = useState<boolean>(false);

  // --- Model Results State ---
  const [optResult, setOptResult] = useState<OptimisationResult | null>(null);
  const [robustness, setRobustness] = useState<RobustnessRow[]>([]);
  const [strategyComparison, setStrategyComparison] = useState<StrategyResult[]>([]);
  const [frontier, setFrontier] = useState<FrontierRow[]>([]);
  const [levers, setLevers] = useState<LeverRow[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Presets mapping from the 7 reference scenarios
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case "default":
        setBudgetUSDm(10000);
        setTargetMt(25);
        setScenario("Announced pledges (IEA APS)");
        setObjective("Maximise financial return (NPV)");
        setMaxCountryShare(0.3);
        setMinSectorShare(0.2);
        setMaxProjectShare(0.3);
        break;
      case "impact_first":
        setBudgetUSDm(10000);
        setTargetMt(0);
        setScenario("Announced pledges (IEA APS)");
        setObjective("Maximise CO2e avoided");
        setMaxCountryShare(0.3);
        setMinSectorShare(0.2);
        setMaxProjectShare(0.3);
        break;
      case "net_zero":
        setBudgetUSDm(10000);
        setTargetMt(25);
        setScenario("Net zero (IEA NZE)");
        setObjective("Maximise financial return (NPV)");
        setMaxCountryShare(0.3);
        setMinSectorShare(0.2);
        setMaxProjectShare(0.3);
        break;
      case "current_prices":
        setBudgetUSDm(10000);
        setTargetMt(25);
        setScenario("Current policies");
        setObjective("Maximise financial return (NPV)");
        setMaxCountryShare(0.3);
        setMinSectorShare(0.2);
        setMaxProjectShare(0.3);
        break;
      case "big_budget":
        setBudgetUSDm(20000);
        setTargetMt(45);
        setScenario("Announced pledges (IEA APS)");
        setObjective("Maximise financial return (NPV)");
        setMaxCountryShare(0.3);
        setMinSectorShare(0.2);
        setMaxProjectShare(0.3);
        break;
      case "loose_limits":
        setBudgetUSDm(10000);
        setTargetMt(25);
        setScenario("Announced pledges (IEA APS)");
        setObjective("Maximise financial return (NPV)");
        setMaxCountryShare(0.5);
        setMinSectorShare(0.05);
        setMaxProjectShare(0.5);
        break;
    }
  };

  // Build projects for current scenario
  const projects = useMemo(() => {
    return buildProjects(scenario);
  }, [scenario]);

  // Main optimization effect with debounce
  useEffect(() => {
    setIsCalculating(true);
    const handler = setTimeout(async () => {
      try {
        const res = await optimisePortfolio(
          projects,
          budgetUSDm,
          objective,
          targetMt,
          maxCountryShare,
          minSectorShare,
          maxProjectShare
        );
        const robust = computeRobustness(res.plan);
        const strats = await compareStrategies(
          projects,
          budgetUSDm,
          targetMt,
          maxCountryShare,
          minSectorShare,
          maxProjectShare
        );

        setOptResult(res);
        setRobustness(robust);
        setStrategyComparison(strats);

        // Run frontier and levers asynchronously after main result
        setIsFrontierLoading(true);
        setTimeout(async () => {
          const [front, levs] = await Promise.all([
            computeFrontier(projects, maxCountryShare, minSectorShare, maxProjectShare),
            computeLevers(
              scenario,
              budgetUSDm,
              objective,
              targetMt,
              maxCountryShare,
              minSectorShare,
              maxProjectShare
            ),
          ]);
          setFrontier(front);
          setLevers(levs);
          setIsFrontierLoading(false);

          // Generate auto-recommendations with full lever context
          const recs = generateRecommendations(res, robust, levs, targetMt);
          setRecommendations(recs);
        }, 50);
      } catch (err) {
        console.error("Optimization calculation error:", err);
      } finally {
        setIsCalculating(false);
      }
    }, 150);

    return () => clearTimeout(handler);
  }, [
    projects,
    budgetUSDm,
    targetMt,
    scenario,
    objective,
    maxCountryShare,
    minSectorShare,
    maxProjectShare,
  ]);

  // Download plan CSV handler
  const handleDownloadPlanCSV = () => {
    if (!optResult || optResult.plan.length === 0) return;
    const headers = [
      "Country",
      "Sector",
      "Project",
      "Invest_USDm",
      "Max_invest_USDm",
      "NPV_per_USD",
      "Tonnes_per_USDm",
      "Mt_Avoided_per_year",
    ];
    const rows = optResult.plan.map((p) => [
      p.Country,
      p.Sector,
      `"${p.Project}"`,
      p.Invest_USDm.toFixed(2),
      p.Max_invest_USDm.toFixed(2),
      p.NPV_per_USD.toFixed(4),
      p.Tonnes_per_USDm.toFixed(2),
      ((p.Invest_USDm * p.Tonnes_per_USDm) / 1e6).toFixed(4),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `optimised_plan_${budgetUSDm}m_${scenario.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CHART B2: MACC Preparation ---
  const sortedMacc = useMemo(() => {
    const list = [...projects].sort(
      (a, b) => a.Abatement_cost_per_t - b.Abatement_cost_per_t
    );
    let cum = 0;
    return list.map((p) => {
      const xStart = cum;
      cum += p.Max_Mt;
      return {
        ...p,
        xStart,
        cumEnd: cum,
        xCenter: xStart + p.Max_Mt / 2,
      };
    });
  }, [projects]);

  const maccSelfPayMt = useMemo(() => {
    return sortedMacc
      .filter((p) => p.Abatement_cost_per_t < 0)
      .reduce((sum, p) => sum + p.Max_Mt, 0);
  }, [sortedMacc]);

  const maccTotalMt = useMemo(() => {
    return sortedMacc.reduce((sum, p) => sum + p.Max_Mt, 0);
  }, [sortedMacc]);

  const SECTOR_COLOURS: Record<string, string> = {
    "Power Industry": "#F4A261",
    "Industrial Combustion": "#2A9D8F",
    Agriculture: "#6A994E",
  };

  const maccTraces: Plotly.Data[] = useMemo(() => {
    const sectors = ["Power Industry", "Industrial Combustion", "Agriculture"];
    return sectors.map((sec) => {
      const sProjects = sortedMacc.filter((p) => p.Sector === sec);
      return {
        type: "bar",
        name: sec,
        x: sProjects.map((p) => p.xCenter),
        y: sProjects.map((p) => p.Abatement_cost_per_t),
        width: sProjects.map((p) => p.Max_Mt),
        marker: { color: SECTOR_COLOURS[sec], line: { color: "white", width: 0.5 } },
        customdata: sProjects.map((p) => [
          p.Country,
          p.Project,
          p.Abatement_cost_per_t.toFixed(1),
          p.Max_Mt.toFixed(1),
          p.NPV_per_USD.toFixed(2),
        ]),
        hovertemplate:
          "<b>%{customdata[0]} – %{customdata[1]}</b><br>" +
          "Cost: $%{customdata[2]} / tonne<br>" +
          "Potential: %{customdata[3]} Mt/yr<br>" +
          "NPV / $: $%{customdata[4]}<extra></extra>",
      };
    });
  }, [sortedMacc]);

  const maccPriceLines = useMemo((): Partial<Plotly.Shape>[] => {
    if (scenario === "Current policies") return [];
    const prices = (assumptionsData.SCENARIO_PRICES as any)[scenario];
    if (!prices) return [];
    return [
      {
        type: "line" as const,
        xref: "paper" as const,
        x0: 0,
        x1: 1,
        yref: "y" as const,
        y0: prices.Advanced,
        y1: prices.Advanced,
        line: { color: "#172554", width: 1.5, dash: "dash" as any },
      },
      {
        type: "line" as const,
        xref: "paper" as const,
        x0: 0,
        x1: 1,
        yref: "y" as const,
        y0: prices.Emerging,
        y1: prices.Emerging,
        line: { color: "#7f1d1d", width: 1.5, dash: "dash" as any },
      },
    ];
  }, [scenario]);

  const maccPriceAnnotations = useMemo((): any[] => {
    if (scenario === "Current policies") return [];
    const prices = (assumptionsData.SCENARIO_PRICES as any)[scenario];
    if (!prices) return [];
    return [
      {
        xref: "paper",
        x: 0.02,
        y: prices.Advanced + 6,
        text: `Advanced-economy carbon price $${prices.Advanced}`,
        showarrow: false,
        font: { size: 10, color: "#172554", weight: 600 },
        bgcolor: "rgba(255,255,255,0.8)",
      },
      {
        xref: "paper",
        x: 0.02,
        y: prices.Emerging + 6,
        text: `Emerging-economy carbon price $${prices.Emerging}`,
        showarrow: false,
        font: { size: 10, color: "#7f1d1d", weight: 600 },
        bgcolor: "rgba(255,255,255,0.8)",
      },
    ];
  }, [scenario]);

  // --- CHART B3: "Where the money goes" (Cells 18 & 21) ---
  const b3CountryAlloc = useMemo(() => {
    if (!optResult) return { countries: [], amounts: [] };
    const list = Object.entries(optResult.by_country_usdm).sort(
      (a, b) => a[1] - b[1]
    );
    return {
      countries: list.map((e) => e[0]),
      amounts: list.map((e) => e[1] / 1000), // in US$ bn
    };
  }, [optResult]);

  const b3ProjectMt = useMemo(() => {
    if (!optResult) return { projects: [], mts: [], sectors: [] };
    const mtTotals: Record<string, { mt: number; sector: string }> = {};
    for (const p of optResult.plan) {
      if (!mtTotals[p.Project]) {
        mtTotals[p.Project] = { mt: 0, sector: p.Sector };
      }
      mtTotals[p.Project].mt += (p.Invest_USDm * p.Tonnes_per_USDm) / 1e6;
    }
    const list = Object.entries(mtTotals).sort((a, b) => a[1].mt - b[1].mt);
    return {
      projects: list.map((e) => e[0]),
      mts: list.map((e) => e[1].mt),
      sectors: list.map((e) => e[1].sector),
    };
  }, [optResult]);

  // --- CHART B4: Strategy Comparison Traces ---
  const b4Traces = useMemo((): { p1: any; p2: any; p3: any } => {
    if (strategyComparison.length === 0) return { p1: {}, p2: {}, p3: {} };
    const labels = strategyComparison.map((s) =>
      s.Within_risk_limits === "No" ? `${s.Strategy}\n(breaks limits)` : s.Strategy
    );
    const colors = ["#95A5A6", "#BDC3C7", "#C0392B", "#2A9D8F"];

    const p1: Plotly.Data = {
      type: "bar",
      x: labels,
      y: strategyComparison.map((s) => s.Mt_avoided_per_year),
      text: strategyComparison.map((s) => s.Mt_avoided_per_year.toFixed(1)),
      textposition: "outside",
      marker: { color: colors },
    };

    const p2: Plotly.Data = {
      type: "bar",
      x: labels,
      y: strategyComparison.map((s) => s.NPV_USDm / 1000),
      text: strategyComparison.map((s) => `$${(s.NPV_USDm / 1000).toFixed(1)} bn`),
      textposition: "outside",
      marker: { color: colors },
    };

    const p3: Plotly.Data = {
      type: "bar",
      x: labels,
      y: strategyComparison.map((s) => s.Capital_per_t_per_year),
      text: strategyComparison.map((s) => `$${s.Capital_per_t_per_year.toFixed(0)}`),
      textposition: "outside",
      marker: { color: colors },
    };

    return { p1, p2, p3 };
  }, [strategyComparison]);

  // Uplift calculation
  const strategyUplift = useMemo(() => {
    const eq = strategyComparison.find((s) => s.Strategy === "Equal split");
    const opt = strategyComparison.find((s) => s.Strategy === "Optimised – impact");
    if (!eq || !opt || eq.Mt_avoided_per_year === 0) return "1.5";
    return (opt.Mt_avoided_per_year / eq.Mt_avoided_per_year).toFixed(1);
  }, [strategyComparison]);

  // --- CHART B5: Carbon Price Risk ---
  const b5Trace: Plotly.Data = useMemo(() => {
    if (robustness.length === 0) return { type: "bar", x: [], y: [] };
    const shortNames = ["Today's prices", "Pledges (APS)", "Net zero (NZE)"];
    return {
      type: "bar",
      x: shortNames,
      y: robustness.map((r) => r.NPV_USD_bn),
      text: robustness.map(
        (r) => `US$ ${r.NPV_USD_bn.toFixed(1)} bn · ROI ${r.ROI_pct.toFixed(0)}%`
      ),
      textposition: "outside",
      marker: {
        color: robustness.map((r) => (r.NPV_USD_bn >= 0 ? "#2A9D8F" : "#D9534F")),
      },
      hoverinfo: "x+text",
    };
  }, [robustness]);

  // KPI Cards array
  const kpiCards: KpiCardItem[] = useMemo(() => {
    if (!optResult) return [];
    const kpi = optResult.kpi;
    const curPolicy = robustness.find((r) => r.Scenario === "Current policies");
    const downsideBn = curPolicy ? curPolicy.NPV_USD_bn : 0;

    return [
      {
        label: "Invested Capital",
        value: formatUSDbn(kpi.Invested_USDm, 1),
        subtext: `Target budget: ${formatUSDbn(budgetUSDm, 0)}`,
        color: "#172554",
      },
      {
        label: "CO₂e Avoided",
        value: formatMt(kpi.Mt_avoided_per_year, 1),
        subtext: `Lifetime: ${formatMt(kpi.Lifetime_Mt_avoided, 1, "Mt")}`,
        color: "#164e63",
      },
      {
        label: "Net Present Value (NPV)",
        value: formatUSDbn(kpi.NPV_USDm, 1),
        subtext: `Under ${scenario}`,
        color: "#365314",
      },
      {
        label: "ROI · Payback",
        value: `${kpi.ROI_pct.toFixed(0)}% · ${kpi.Payback_years.toFixed(1)} yrs`,
        subtext: `Capital: $${kpi.Capital_per_t_per_year.toFixed(0)} / t/yr`,
        color: "#365314",
      },
      {
        label: `Target ${targetMt} Mt/yr`,
        value: optResult.target_met ? "TARGET MET" : "NOT MET",
        subtext: optResult.target_met
          ? `Surplus: +${(kpi.Mt_avoided_per_year - targetMt).toFixed(1)} Mt/yr`
          : `Shortfall: ${(targetMt - kpi.Mt_avoided_per_year).toFixed(1)} Mt/yr`,
        color: optResult.target_met ? "#166534" : "#991b1b",
        badge: optResult.target_met ? "Met" : "Deficit",
        badgeColor: optResult.target_met ? "green" : "red",
      },
      {
        label: "NPV at Today's Carbon Prices",
        value: formatUSDbn(downsideBn * 1000, 1),
        subtext: "Downside stress case (no carbon price expansion)",
        color: downsideBn >= 0 ? "#3f3f46" : "#991b1b",
      },
    ];
  }, [optResult, budgetUSDm, scenario, targetMt, robustness]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider">
            <span>Part B · Linear Programming Portfolio Simulator</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Fund Simulator & Strategy Optimizer
          </h1>
          <p className="text-sm text-slate-500">
            Live calculation in browser using HiGHS linear programming solver (same engine as SciPy linprog)
          </p>
        </div>

        {/* Calculating badge */}
        {isCalculating && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold animate-pulse self-start">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>Recalculating portfolio...</span>
          </div>
        )}
      </div>

      {/* Main Grid: Left sticky controls + Right results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* --- LEFT COLUMN: STICKY CONTROL PANEL (lg:col-span-4) --- */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-teal-700" />
                <h2 className="text-base font-bold text-slate-900">
                  Fund Control Panel
                </h2>
              </div>
              <button
                onClick={() => applyPreset("default")}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-700 font-medium transition"
                title="Reset to default settings"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Reference Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Scenario Presets (Notebook Cases)
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  onClick={() => applyPreset("default")}
                  className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 font-medium text-left transition truncate"
                >
                  • Default Plan
                </button>
                <button
                  onClick={() => applyPreset("impact_first")}
                  className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 font-medium text-left transition truncate"
                >
                  • Impact-First
                </button>
                <button
                  onClick={() => applyPreset("net_zero")}
                  className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 font-medium text-left transition truncate"
                >
                  • Net-Zero Prices
                </button>
                <button
                  onClick={() => applyPreset("current_prices")}
                  className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 font-medium text-left transition truncate"
                >
                  • Today&apos;s Prices
                </button>
                <button
                  onClick={() => applyPreset("big_budget")}
                  className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 font-medium text-left transition truncate"
                >
                  • US$20 bn / 45 Mt
                </button>
                <button
                  onClick={() => applyPreset("loose_limits")}
                  className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 font-medium text-left transition truncate"
                >
                  • Loose Limits
                </button>
              </div>
            </div>

            {/* Slider 1: Budget */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Fund Budget (US$)</span>
                <span className="font-mono font-bold text-teal-800 text-sm">
                  {formatUSDbn(budgetUSDm, 0)}
                </span>
              </div>
              <input
                type="range"
                min={control_ranges.BUDGET_USD_M.min}
                max={control_ranges.BUDGET_USD_M.max}
                step={control_ranges.BUDGET_USD_M.step}
                value={budgetUSDm}
                onChange={(e) => setBudgetUSDm(parseInt(e.target.value, 10))}
                className="w-full accent-teal-700 cursor-pointer"
                aria-label="Fund Budget Slider"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>$1 bn</span>
                <span>$40 bn</span>
                <span>$80 bn</span>
              </div>
            </div>

            {/* Slider 2: Annual Abatement Target */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">
                  Abatement Target (Mt/yr)
                </span>
                <span className="font-mono font-bold text-teal-800 text-sm">
                  {targetMt} Mt CO₂e/yr
                </span>
              </div>
              <input
                type="range"
                min={control_ranges.TARGET_MT_PER_YEAR.min}
                max={control_ranges.TARGET_MT_PER_YEAR.max}
                step={control_ranges.TARGET_MT_PER_YEAR.step}
                value={targetMt}
                onChange={(e) => setTargetMt(parseInt(e.target.value, 10))}
                className="w-full accent-teal-700 cursor-pointer"
                aria-label="Annual Abatement Target Slider"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 Mt</span>
                <span>100 Mt</span>
                <span>200 Mt</span>
              </div>
            </div>

            {/* Segmented Control 3: Scenario */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Carbon Price Scenario
              </label>
              <div className="space-y-1.5">
                {[
                  {
                    name: "Current policies",
                    desc: "Existing national carbon prices; $5 voluntary credit for agriculture",
                  },
                  {
                    name: "Announced pledges (IEA APS)",
                    desc: "IEA APS 2035: $160 advanced / $65 emerging economies",
                  },
                  {
                    name: "Net zero (IEA NZE)",
                    desc: "IEA NZE 2035: $180 advanced / $125 emerging economies",
                  },
                ].map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setScenario(s.name)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition ${
                      scenario === s.name
                        ? "border-teal-600 bg-teal-50/70 text-teal-950 font-semibold shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="font-medium text-slate-900">{s.name}</div>
                    <div className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                      {s.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Segmented Control 4: Objective */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Optimization Objective
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    name: "Maximise financial return (NPV)",
                    label: "Max Return (NPV)",
                  },
                  {
                    name: "Maximise CO2e avoided",
                    label: "Max CO₂ Avoided",
                  },
                ].map((o) => (
                  <button
                    key={o.name}
                    onClick={() => setObjective(o.name)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition text-center ${
                      objective === o.name
                        ? "border-teal-700 bg-teal-800 text-white shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Limit Sliders */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Risk Management Limits
              </span>

              {/* Country Cap */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Max Share / Country</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatPct(maxCountryShare * 100, 0)} (US$ {((maxCountryShare * budgetUSDm) / 1000).toFixed(1)} bn)
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={maxCountryShare}
                  onChange={(e) => setMaxCountryShare(parseFloat(e.target.value))}
                  className="w-full accent-teal-700 cursor-pointer"
                  aria-label="Max Country Share Slider"
                />
              </div>

              {/* Technology Cap */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Max Share / Technology</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatPct(maxProjectShare * 100, 0)} (US$ {((maxProjectShare * budgetUSDm) / 1000).toFixed(1)} bn)
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={maxProjectShare}
                  onChange={(e) => setMaxProjectShare(parseFloat(e.target.value))}
                  className="w-full accent-teal-700 cursor-pointer"
                  aria-label="Max Technology Share Slider"
                />
              </div>

              {/* Sector Floor */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Min Floor / Sector</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatPct(minSectorShare * 100, 0)} (US$ {((minSectorShare * budgetUSDm) / 1000).toFixed(1)} bn)
                  </span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={0.33}
                  step={0.01}
                  value={minSectorShare}
                  onChange={(e) => setMinSectorShare(parseFloat(e.target.value))}
                  className="w-full accent-teal-700 cursor-pointer"
                  aria-label="Min Sector Floor Slider"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* --- RIGHT COLUMN: RESULTS & FIVE PART B CHARTS (lg:col-span-8) --- */}
        <main className="lg:col-span-8 space-y-10">
          {/* 1. Status Banner */}
          {optResult && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                optResult.status === "All constraints satisfied"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                  : "bg-amber-50/80 border-amber-200 text-amber-950"
              }`}
            >
              <div className="flex items-center gap-3">
                {optResult.status === "All constraints satisfied" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <strong className="text-sm font-semibold">
                    Optimization Status: {optResult.status}
                  </strong>
                  <p className="text-xs text-slate-600">
                    {optResult.status === "All constraints satisfied"
                      ? "Feasible optimal solution identified respecting all capital and risk constraints."
                      : "Target infeasible under chosen risk bounds — solver redirected to display maximum impact plan."}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500 whitespace-nowrap">
                Cell 18 HiGHS
              </span>
            </div>
          )}

          {/* 2. KPI Cards */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Portfolio Performance Metrics
              </h3>
              <span className="text-xs text-slate-400">Logic: notebook Cell 18</span>
            </div>
            <KpiCards cards={kpiCards} columns={3} />
          </section>

          {/* 3. 📊 CHART B2: Marginal Abatement Cost Curve (Cell 17) */}
          <section className="space-y-3">
            <ChartCard
              title="Chart B2: Marginal Abatement Cost Curve (MACC)"
              cellNumber={17}
              insight={`For the ${scenario} scenario, ${formatMt(maccSelfPayMt, 1, "Mt")} of the total ${formatMt(maccTotalMt, 1, "Mt")} available abatement potential pays for itself even with zero carbon price (negative net cost per tonne). Bars below scenario dashed lines pay for themselves under carbon markets.`}
              headerAction={
                <div className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-50 border border-teal-200 text-teal-800">
                  {formatMt(maccSelfPayMt, 1, "Mt")} Self-Financing
                </div>
              }
            >
              <div className="space-y-4">
                <div className="h-[460px]">
                  <PlotlyChart
                    data={maccTraces}
                    layout={{
                      height: 440,
                      barmode: "overlay",
                      margin: { l: 60, r: 30, t: 30, b: 60 },
                      xaxis: {
                        title: {
                          text: "Cumulative emissions the fund could avoid (Mt CO₂e per year)",
                        },
                      },
                      yaxis: {
                        title: { text: "Net cost per tonne avoided (US$)" },
                        zeroline: true,
                        zerolinecolor: "black",
                        zerolinewidth: 1.5,
                      },
                      shapes: [
                        ...maccPriceLines,
                        {
                          type: "line",
                          xref: "paper",
                          x0: 0,
                          x1: 1,
                          yref: "y",
                          y0: 0,
                          y1: 0,
                          line: { color: "black", width: 1.5 },
                        },
                      ],
                      annotations: maccPriceAnnotations,
                      showlegend: true,
                      legend: { orientation: "h", y: -0.2 },
                    }}
                  />
                </div>

                {/* Collapsible Full Project Universe Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowAllMaccProjects(!showAllMaccProjects)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition"
                  >
                    <span>
                      {showAllMaccProjects ? "Hide" : "View"} Full 80-Project Universe Table (Sorted by Cost per Tonne)
                    </span>
                    {showAllMaccProjects ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {showAllMaccProjects && (
                    <div className="overflow-x-auto table-scrollbar max-h-80 p-2">
                      <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                        <thead className="bg-slate-100 font-semibold text-slate-700">
                          <tr>
                            <th className="py-2 px-3">Country</th>
                            <th className="py-2 px-3">Project</th>
                            <th className="py-2 px-3 text-right">Cost / t ($)</th>
                            <th className="py-2 px-3 text-right">t / $1m</th>
                            <th className="py-2 px-3 text-right">NPV / $</th>
                            <th className="py-2 px-3 text-right">Max Mt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {sortedMacc.map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition">
                              <td className="py-1.5 px-3 font-sans font-medium text-slate-900">
                                {p.Country}
                              </td>
                              <td className="py-1.5 px-3 font-sans text-slate-700">
                                {p.Project}
                              </td>
                              <td
                                className={`py-1.5 px-3 text-right font-bold ${
                                  p.Abatement_cost_per_t < 0
                                    ? "text-emerald-700"
                                    : "text-slate-800"
                                }`}
                              >
                                ${p.Abatement_cost_per_t.toFixed(1)}
                              </td>
                              <td className="py-1.5 px-3 text-right">
                                {formatNumber(p.Tonnes_per_USDm, 0)}
                              </td>
                              <td className="py-1.5 px-3 text-right">
                                ${p.NPV_per_USD.toFixed(2)}
                              </td>
                              <td className="py-1.5 px-3 text-right font-medium">
                                {p.Max_Mt.toFixed(2)} Mt
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </ChartCard>
          </section>

          {/* 4. 📊 CHART B3: "Where the money goes" (Cells 18 & 21) */}
          <section className="space-y-4">
            <ChartCard
              title="Chart B3: Recommended Portfolio Allocation & Impact"
              cellNumber="18 & 21"
              insight="The optimal linear allocation balances capital limits across countries with high-abatement project types. Red dashed line indicates the strict country exposure cap."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: US$ bn per country */}
                <div className="h-80">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                    Investment by Country (US$ bn)
                  </h4>
                  <PlotlyChart
                    data={[
                      {
                        type: "bar",
                        orientation: "h",
                        y: b3CountryAlloc.countries,
                        x: b3CountryAlloc.amounts,
                        text: b3CountryAlloc.amounts.map(
                          (a) => `US$ ${a.toFixed(2)} bn`
                        ),
                        textposition: "outside",
                        marker: { color: "#247BA0" },
                        hoverinfo: "x+y",
                      },
                    ]}
                    layout={{
                      height: 300,
                      margin: { l: 100, r: 60, t: 15, b: 40 },
                      xaxis: {
                        title: { text: "US$ bn" },
                        range: [0, (maxCountryShare * budgetUSDm) / 1000 * 1.25],
                      },
                      yaxis: { automargin: true },
                      shapes: [
                        {
                          type: "line",
                          x0: (maxCountryShare * budgetUSDm) / 1000,
                          x1: (maxCountryShare * budgetUSDm) / 1000,
                          yref: "paper",
                          y0: 0,
                          y1: 1,
                          line: { color: "#C0392B", width: 1.5, dash: "dash" as any },
                        },
                      ],
                    }}
                  />
                </div>

                {/* Right: Mt avoided by project type */}
                <div className="h-80">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                    Annual Impact by Technology (Mt CO₂e)
                  </h4>
                  <PlotlyChart
                    data={[
                      {
                        type: "bar",
                        orientation: "h",
                        y: b3ProjectMt.projects,
                        x: b3ProjectMt.mts,
                        text: b3ProjectMt.mts.map((m) => `${m.toFixed(1)} Mt`),
                        textposition: "outside",
                        marker: {
                          color: b3ProjectMt.sectors.map(
                            (s) => SECTOR_COLOURS[s] || "#247BA0"
                          ),
                        },
                        hoverinfo: "x+y",
                      },
                    ]}
                    layout={{
                      height: 300,
                      margin: { l: 150, r: 50, t: 15, b: 40 },
                      xaxis: { title: { text: "Mt CO₂e avoided / yr" } },
                      yaxis: { automargin: true },
                    }}
                  />
                </div>
              </div>
            </ChartCard>

            {/* Plan Table & Download Button */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Recommended Project Allocations Table
                  </h3>
                  <p className="text-xs text-slate-500">
                    Showing projects receiving &gt; US$ 0.5m capital allocation
                  </p>
                </div>
                <button
                  onClick={handleDownloadPlanCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition self-start"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download plan as CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto table-scrollbar max-h-80">
                <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                  <thead className="bg-slate-50 sticky top-0 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2 px-3">Country</th>
                      <th className="py-2 px-3">Sector</th>
                      <th className="py-2 px-3">Project</th>
                      <th className="py-2 px-3 text-right">Invested (US$m)</th>
                      <th className="py-2 px-3 text-right">Max Cap (US$m)</th>
                      <th className="py-2 px-3 text-right">NPV / $</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {optResult?.plan
                      .sort((a, b) => b.Invest_USDm - a.Invest_USDm)
                      .map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                            {p.Country}
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-600">
                            {p.Sector}
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-800">
                            {p.Project}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-teal-800">
                            ${p.Invest_USDm.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">
                            ${p.Max_invest_USDm.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-800">
                            ${p.NPV_per_USD.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="py-2 px-3 font-sans text-slate-900">
                        Total Portfolio Allocation
                      </td>
                      <td className="py-2 px-3 text-right text-teal-900 font-mono">
                        ${optResult?.kpi.Invested_USDm.toFixed(2)}m
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Investment by Sector Table */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  Capital Distribution by Sector
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(optResult?.by_sector_usdm || {}).map(
                    ([sec, val]) => (
                      <div
                        key={sec}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/50"
                        style={{ borderLeft: `3px solid ${SECTOR_COLOURS[sec]}` }}
                      >
                        <span className="text-xs text-slate-500 block">{sec}</span>
                        <span className="text-base font-bold text-slate-900 font-mono">
                          ${val.toFixed(1)}m (
                          {(((val) / (optResult?.kpi.Invested_USDm || 1)) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 5. 📊 CHART B4: Strategy Comparison (Cell 19) */}
          <section className="space-y-4">
            <ChartCard
              title="Chart B4: Strategy Comparison — Value of Analytics vs Heuristics"
              cellNumber={19}
              insight={`The impact-optimised linear program avoids ${strategyUplift}× more emissions than an uncalibrated equal split rule across the 33 markets for the exact same budget.`}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Panel 1 */}
                  <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 h-72">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 text-center">
                      Avoided (Mt CO₂e / yr)
                    </h4>
                    <PlotlyChart
                      data={b4Traces.p1.x ? [b4Traces.p1 as any] : []}
                      layout={{
                        height: 250,
                        margin: { l: 40, r: 15, t: 15, b: 70 },
                        xaxis: { tickangle: -20 },
                        yaxis: { title: { text: "Mt CO₂e / yr" } },
                        shapes: [
                          {
                            type: "line",
                            xref: "paper",
                            x0: 0,
                            x1: 1,
                            yref: "y",
                            y0: targetMt,
                            y1: targetMt,
                            line: { color: "black", width: 1.5, dash: "dash" as any },
                          },
                        ],
                      }}
                    />
                  </div>

                  {/* Panel 2 */}
                  <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 h-72">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 text-center">
                      NPV (US$ bn)
                    </h4>
                    <PlotlyChart
                      data={b4Traces.p2.x ? [b4Traces.p2 as any] : []}
                      layout={{
                        height: 250,
                        margin: { l: 40, r: 15, t: 15, b: 70 },
                        xaxis: { tickangle: -20 },
                        yaxis: { title: { text: "US$ bn" } },
                      }}
                    />
                  </div>

                  {/* Panel 3 */}
                  <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 h-72">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 text-center">
                      Capital / Tonne / yr ($)
                    </h4>
                    <PlotlyChart
                      data={b4Traces.p3.x ? [b4Traces.p3 as any] : []}
                      layout={{
                        height: 250,
                        margin: { l: 45, r: 15, t: 15, b: 70 },
                        xaxis: { tickangle: -20 },
                        yaxis: { title: { text: "US$ / t/yr" } },
                      }}
                    />
                  </div>
                </div>

                {/* Full comparison table */}
                <div className="overflow-x-auto table-scrollbar">
                  <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                    <thead className="bg-slate-50 font-semibold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Strategy</th>
                        <th className="py-2.5 px-3 text-right">Mt / yr</th>
                        <th className="py-2.5 px-3 text-right">NPV (US$m)</th>
                        <th className="py-2.5 px-3 text-right">ROI %</th>
                        <th className="py-2.5 px-3 text-right">Payback (yrs)</th>
                        <th className="py-2.5 px-3 text-right">Capital / t/yr</th>
                        <th className="py-2.5 px-3 text-center">Within Limits?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {strategyComparison.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                            {s.Strategy}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-teal-800">
                            {s.Mt_avoided_per_year.toFixed(1)} Mt
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            ${s.NPV_USDm.toFixed(1)}m
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {s.ROI_pct.toFixed(0)}%
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {s.Payback_years.toFixed(1)} yrs
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            ${s.Capital_per_t_per_year.toFixed(0)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.Within_risk_limits === "Yes"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {s.Within_risk_limits}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ChartCard>
          </section>

          {/* 6. 📊 CHART B5: Carbon-Price Risk (Cell 20) */}
          <section className="space-y-4">
            <ChartCard
              title="Chart B5: Carbon-Price Risk — Re-Valuing the Same Recommended Plan"
              cellNumber={20}
              insight="Testing the exact recommended plan across the 3 future pricing trajectories demonstrates value resilience: the plan generates significant returns under pledged climate policies, with upside accelerating under Net Zero."
            >
              <div className="h-[420px]">
                <PlotlyChart
                  data={b5Trace.x ? [b5Trace as any] : []}
                  layout={{
                    height: 400,
                    margin: { l: 60, r: 40, t: 20, b: 50 },
                    xaxis: { title: { text: "Carbon Price Scenario" } },
                    yaxis: {
                      title: { text: "NPV of Current Recommended Plan (US$ bn)" },
                      zeroline: true,
                      zerolinecolor: "black",
                      zerolinewidth: 1.5,
                    },
                  }}
                />
              </div>
            </ChartCard>
          </section>

          {/* 7. Stress Tests (Tables only, Cell 20) */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Stress Tests & Policy Levers (Tables Only)
              </h3>
              <p className="text-xs text-slate-500">
                Logic: notebook Cell 20 · (a) Budget frontier scale curve · (b) De-risking levers for emerging markets
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* (a) Budget Frontier Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    (a) Capital Frontier ($4–80 bn)
                  </h4>
                  {isFrontierLoading && (
                    <span className="text-[10px] text-amber-600 animate-pulse">
                      Updating...
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto table-scrollbar max-h-64 border border-slate-200 rounded-lg">
                  <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0 font-semibold text-slate-700">
                      <tr>
                        <th className="py-1.5 px-3">Budget</th>
                        <th className="py-1.5 px-3 text-right">Avoided Mt/yr</th>
                        <th className="py-1.5 px-3 text-right">Capital / t/yr</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {frontier.map((row, idx) => {
                        const isChosen =
                          row.Budget_USDm === budgetUSDm ||
                          (idx > 0 &&
                            budgetUSDm > frontier[idx - 1].Budget_USDm &&
                            budgetUSDm < row.Budget_USDm);
                        return (
                          <tr
                            key={idx}
                            className={`transition ${
                              isChosen
                                ? "bg-teal-50 font-bold text-teal-950"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-1.5 px-3">
                              ${(row.Budget_USDm / 1000).toFixed(0)} bn
                              {row.Budget_USDm === budgetUSDm && " (chosen)"}
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              {row.Mt.toFixed(1)} Mt
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              ${row.Capital_per_t.toFixed(0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* (b) Financing Levers Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  (b) Emerging Market Capital Levers
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                    <thead className="bg-slate-50 font-semibold text-slate-700">
                      <tr>
                        <th className="py-2 px-3">Financing Lever</th>
                        <th className="py-2 px-3 text-right">% to India, Indonesia, Brazil, SA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {levers.map((l, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                            {l.Lever}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-teal-800">
                            {l.Share_to_EMDE_pct.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  Return-seeking capital naturally concentrates in low-discount advanced markets.
                  Providing concessional 6% borrowing rates or full international carbon credits
                  radically expands emerging market capital mobilization.
                </p>
              </div>
            </div>
          </section>

          {/* 8. Auto-written Recommendations (Cell 21) */}
          <section className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-md space-y-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Automated Strategic Recommendations
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Rule-Based Engine · Cell 21
              </span>
            </div>

            <ol className="space-y-3 text-sm text-slate-200 list-decimal list-inside leading-relaxed">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="pl-1">
                  <span className="text-slate-100">{rec}</span>
                </li>
              ))}
            </ol>
          </section>
        </main>
      </div>
    </div>
  );
}
