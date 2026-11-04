import React from "react";
import Link from "next/link";
import { Info, ArrowLeft, ExternalLink, BarChart3, TrendingUp, SlidersHorizontal } from "lucide-react";

export default function ChartSourcesPage() {
  const partATable = [
    {
      id: "A1",
      title: "Data-quality table",
      cell: "Cell 3",
      shows: "Rows, countries, sectors, years, duplicates, missing values",
      sourceKey: "part_a_charts.json → cell3_quality_table",
      page: "/history",
    },
    {
      id: "A2",
      title: "KPI cards + sector donut + sector bar (2025)",
      cell: "Cell 4",
      shows: "Power Industry is 59.8% of 2025 emissions",
      sourceKey: "cell4_sector_dashboard",
      page: "/history",
    },
    {
      id: "A3",
      title: "Country comparison by sector (faceted bars, 2025)",
      cell: "Cell 5",
      shows: "Which countries emit most in each sector",
      sourceKey: "cell5_country_comparison",
      page: "/history",
    },
    {
      id: "A4",
      title: "Treemap sector → country (2025)",
      cell: "Cell 6",
      shows: "Where emissions come from",
      sourceKey: "cell6_treemap",
      page: "/history",
    },
    {
      id: "A5",
      title: "Ranking changes 1990 / 2010 / 2025 (bump chart)",
      cell: "Cell 7",
      shows: "How country ranks moved",
      sourceKey: "cell7_rankings",
      page: "/history",
    },
    {
      id: "A6",
      title: "Change in power emissions 1990–2025 (diverging bars)",
      cell: "Cell 8",
      shows: "Who increased and who cut",
      sourceKey: "cell8_power_change_1990_2025",
      page: "/history",
    },
    {
      id: "A7",
      title: "Sector trends 1990–2025 (small multiples)",
      cell: "Cell 9",
      shows: "Long-run trend of each sector",
      sourceKey: "cell9_sector_trends",
      page: "/history",
    },
    {
      id: "A8",
      title: "Power-sector bar-chart race (animated)",
      cell: "Cell 10",
      shows: "Year-by-year ranking of power emitters",
      sourceKey: "cell10_power_race",
      page: "/history",
    },
  ];

  const partBTable = [
    {
      id: "B1",
      element: "Market priority matrix",
      shownAs: "📊 Graph",
      cell: "Cell 14",
      type: "Fixed: markets.json → cell14_scorecard",
      page: "/markets",
    },
    {
      id: "B2",
      element: "Marginal abatement cost curve (MACC)",
      shownAs: "📊 Graph",
      cell: "Cell 17 (build_projects)",
      type: "Live (changes with scenario)",
      page: "/simulator",
    },
    {
      id: "B3",
      element: '"Where the money goes": US$ per country + Mt avoided per project type',
      shownAs: "📊 Graph",
      cell: "Cells 18 & 21",
      type: "Live calculation",
      page: "/simulator",
    },
    {
      id: "B4",
      element: "Strategy comparison: equal split vs biggest emitters vs optimised",
      shownAs: "📊 Graph",
      cell: "Cell 19",
      type: "Live calculation",
      page: "/simulator",
    },
    {
      id: "B5",
      element: '"Carbon-price risk": NPV of the same plan under today\'s prices / pledges / net zero',
      shownAs: "📊 Graph",
      cell: "Cell 20",
      type: "Live calculation",
      page: "/simulator",
    },
    {
      id: "—",
      element: "Control panel (budget, target, scenario, objective, limits)",
      shownAs: "Controls",
      cell: "Cell 11",
      type: "Defaults from model_assumptions.json → defaults",
      page: "/simulator",
    },
    {
      id: "—",
      element: "Market profiles (33 markets)",
      shownAs: "Table",
      cell: "Cell 12 (MarketProfile class)",
      type: "Fixed: markets.json → cell12_market_profiles",
      page: "/markets",
    },
    {
      id: "—",
      element: "Emissions per person and per US$ GDP",
      shownAs: "Table",
      cell: "Cell 13 (World Bank API)",
      type: "Live API, with stored fallback in markets.json → cell13_economic_context",
      page: "/markets",
    },
    {
      id: "—",
      element: "Priority scorecard table",
      shownAs: "Table",
      cell: "Cell 14",
      type: "Fixed: markets.json → cell14_scorecard",
      page: "/markets",
    },
    {
      id: "—",
      element: "2030 gap vs 1.5 °C path",
      shownAs: "Table + KPI",
      cell: "Cell 15",
      type: "Fixed: markets.json → cell15_outlook",
      page: "/markets",
    },
    {
      id: "—",
      element: "Carbon exposure",
      shownAs: "Table + KPIs",
      cell: "Cell 16",
      type: "Fixed: markets.json → cell16_exposure",
      page: "/markets",
    },
    {
      id: "—",
      element: "Recommended plan, KPI cards",
      shownAs: "Table + KPIs",
      cell: "Cell 18 (optimise_portfolio, portfolio_metrics)",
      type: "Live calculation",
      page: "/simulator",
    },
    {
      id: "—",
      element: "Budget frontier, financing levers",
      shownAs: "Tables",
      cell: "Cell 20",
      type: "Live calculation",
      page: "/simulator",
    },
    {
      id: "—",
      element: "Auto-recommendations",
      shownAs: "Text",
      cell: "Cell 21",
      type: "Live calculation",
      page: "/simulator",
    },
    {
      id: "—",
      element: "Company lens",
      shownAs: "KPIs + tables",
      cell: "Cell 22",
      type: "Live calculation",
      page: "/company",
    },
    {
      id: "—",
      element: "Downloads (plan CSV, assumptions, sources)",
      shownAs: "Buttons",
      cell: "Cell 23",
      type: "Live export",
      page: "/methodology",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider">
          <Info className="w-3.5 h-3.5" />
          <span>Lineage & Traceability Map</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Chart Source Map — Where Every Visual Comes From
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-4xl leading-relaxed">
          Every chart and analytical element on this portal is traceable to an exact cell in the
          underlying Applied Python Jupyter notebook (`IPP_PROJECT_FINAL_simplified.ipynb`).
        </p>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 text-sm text-slate-700 leading-relaxed">
        <p>
          Every visual on the portal is categorized as either:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
          <li>
            <strong className="text-slate-900">Historical (Part A):</strong> a rebuild of a chart in our Colab notebook (Cells 4–10). It uses the exact numbers the notebook calculated, exported to <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-teal-900">data/part_a_charts.json</code> by <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-teal-900">analysis/export_portal_data.py</code>.
          </li>
          <li>
            <strong className="text-slate-900">Live (Part B):</strong> calculated in the browser when you adjust the controls. It uses the same formulas as the notebook cell named in the table, and the starting assumptions come from <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-teal-900">data/model_assumptions.json</code>. Exactly five Part B results are drawn as graphs (B1–B5).
          </li>
        </ul>
        <p className="pt-1 text-xs text-slate-500">
          Raw data: <code className="font-mono text-slate-700">data/EDGAR_sector_emissions_project_dataset.csv</code> (EDGAR Community GHG Database, European Commission JRC). Covers 11 countries, 3 sectors, 1990–2025 in Mt CO₂e.
        </p>
      </div>

      {/* Part A Table */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-900">
              Part A — Historical Analysis (Static, From Notebook Cells 3–10)
            </h2>
          </div>
          <Link
            href="/history"
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>View History Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto table-scrollbar">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Portal Visual</th>
                <th className="py-2.5 px-3">Notebook Cell</th>
                <th className="py-2.5 px-3">What It Shows</th>
                <th className="py-2.5 px-3 font-mono">Data File → JSON Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partATable.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-800">
                    {item.id}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    <Link href={item.page} className="hover:underline text-teal-900">
                      {item.title}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                    {item.cell}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {item.shows}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {item.sourceKey}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Part B Table */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-teal-700" />
            <h2 className="text-lg font-bold text-slate-900">
              Part B — Investment Simulator & Strategy (Cells 11–23, 5 Graphs)
            </h2>
          </div>
          <Link
            href="/simulator"
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>View Simulator</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="text-xs text-slate-600">
          All Part B calculations from notebook Cells 11–23 run live on the portal. Exactly <strong>five Part B results are shown as graphs</strong> (B1–B5) in story order. Every other Part B result is presented as tables, KPI cards, or auto-written text.
        </p>

        <div className="overflow-x-auto table-scrollbar">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Portal Element</th>
                <th className="py-2.5 px-3">Format</th>
                <th className="py-2.5 px-3">Logic Cell</th>
                <th className="py-2.5 px-3">Execution Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partBTable.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-800">
                    {item.id}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    <Link href={item.page} className="hover:underline text-teal-900">
                      {item.element}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.shownAs.includes("Graph")
                          ? "bg-purple-100 text-purple-900"
                          : item.shownAs.includes("Controls")
                          ? "bg-blue-100 text-blue-900"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.shownAs}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">
                    {item.cell}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {item.type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* How to Check a Number Guide */}
      <section className="bg-slate-900 text-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 border border-slate-800">
        <h2 className="text-lg font-bold text-white tracking-tight">
          How to Check Any Number on this Portal
        </h2>
        <ol className="space-y-2 text-xs sm:text-sm text-slate-300 list-decimal list-inside leading-relaxed">
          <li>
            Open <code className="text-teal-300 font-mono">analysis/IPP_PROJECT_FINAL_simplified.ipynb</code> in Google Colab or VS Code and run all cells.
          </li>
          <li>
            Locate the exact cell referenced in the tables above and compare its output with the portal display.
          </li>
          <li>
            Alternatively, run <code className="text-teal-300 font-mono">python analysis/export_portal_data.py</code> from the project root to re-export all JSON datasets directly from the Python notebook code.
          </li>
          <li>
            Run <code className="text-teal-300 font-mono">npm test</code> in your terminal: it executes 13 automated Vitest tests verifying that the TypeScript solver matches SciPy linprog HiGHS results stored in <code className="text-teal-300 font-mono">data/reference_results.json</code> across all 7 scenarios.
          </li>
        </ol>
      </section>
    </div>
  );
}
