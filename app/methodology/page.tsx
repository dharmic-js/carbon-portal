import React from "react";
import Link from "next/link";
import {
  Download,
  BookOpen,
  FileSpreadsheet,
  FileCode,
  FileText,
  ExternalLink,
  ShieldAlert,
  Calculator,
  Layers,
  Database,
  ArrowRight,
} from "lucide-react";

import assumptionsData from "@/data/model_assumptions.json";

export default function MethodologyPage() {
  const { COUNTRY_INFO, SCENARIO_PRICES, INTERVENTIONS, DATA_SOURCES, constants } =
    assumptionsData;

  const externalLinks = [
    {
      name: "EDGAR 2026 GHG Report",
      org: "European Commission JRC",
      url: "https://edgar.jrc.ec.europa.eu/report_2026",
    },
    {
      name: "State & Trends of Carbon Pricing 2026",
      org: "World Bank",
      url: "https://documents1.worldbank.org/curated/en/099051826185087983/pdf/P502283-3ee8b1dc-6f1a-46dd-8141-e6534fd34af9.pdf",
    },
    {
      name: "Global Energy & Climate Model Documentation 2025",
      org: "International Energy Agency (IEA)",
      url: "https://iea.blob.core.windows.net/assets/bccc3753-6330-444e-bc62-356f104ed251/GlobalEnergyandClimateModelDocumentation2025.pdf",
    },
    {
      name: "Renewable Power Generation Costs in 2024 (2025)",
      org: "IRENA",
      url: "https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2025/Jul/IRENA_TEC_RPGC_in_2024_Summary_2025.pdf",
    },
    {
      name: "Energy Dataset (Grid Intensity)",
      org: "Ember via Our World in Data",
      url: "https://github.com/owid/energy-data",
    },
    {
      name: "AR6 Working Group III (Mitigation of Climate Change)",
      org: "IPCC",
      url: "https://www.ipcc.ch/report/ar6/wg3/",
    },
    {
      name: "AR6 Synthesis Report (Longer Report)",
      org: "IPCC",
      url: "https://www.ipcc.ch/report/ar6/syr/",
    },
    {
      name: "World Bank Open Data API v2",
      org: "World Bank",
      url: "https://api.worldbank.org/v2/",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider">
          <span>Documentation & Analytical Reproducibility</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Methodology, Model Specification & Sources
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-4xl leading-relaxed">
          Comprehensive audit trail of the mathematical modeling pipeline, linear programming
          optimization constraints, economic assumptions, calibrated datasets, and boundary limitations.
        </p>
      </div>

      {/* Downloads Section */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Project Artifacts & Data Downloads
            </h2>
            <p className="text-xs text-slate-500">
              Raw source datasets, Jupyter analysis notebook, written academic report, and model configurations
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-400">
            Open Access
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Download 1: CSV */}
          <a
            href="/downloads/EDGAR_sector_emissions_project_dataset.csv"
            download
            className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-teal-600 hover:bg-teal-50/50 transition group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block group-hover:text-teal-900">
                EDGAR Raw Dataset
              </span>
              <span className="text-[11px] text-slate-500 block">
                CSV · 1,188 rows (127 KB)
              </span>
            </div>
          </a>

          {/* Download 2: Notebook */}
          <a
            href="/downloads/IPP_PROJECT_FINAL_simplified.ipynb"
            download
            className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-teal-600 hover:bg-teal-50/50 transition group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block group-hover:text-teal-900">
                Project Python Notebook
              </span>
              <span className="text-[11px] text-slate-500 block">
                IPYNB · Fully commented (128 KB)
              </span>
            </div>
          </a>

          {/* Download 3: Report */}
          <a
            href="/downloads/IPP_Project_Report_Final.docx"
            download
            className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-teal-600 hover:bg-teal-50/50 transition group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block group-hover:text-teal-900">
                Final Written Report
              </span>
              <span className="text-[11px] text-slate-500 block">
                DOCX · University report (2.5 MB)
              </span>
            </div>
          </a>

          {/* Download 4: Model Assumptions */}
          <a
            href="/downloads/model_assumptions.json"
            download
            className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-teal-600 hover:bg-teal-50/50 transition group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block group-hover:text-teal-900">
                Model Assumptions JSON
              </span>
              <span className="text-[11px] text-slate-500 block">
                JSON · Constants & inputs (11 KB)
              </span>
            </div>
          </a>
        </div>
      </section>

      {/* Mathematical Pipeline Walk-Through */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-700" />
            <h2 className="text-xl font-bold text-slate-900">
              Model Specification & Mathematical Pipeline
            </h2>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500">
            TypeScript ≡ Python Notebook
          </span>
        </div>

        {/* Step 1: Carbon Pricing */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Carbon Price Logic (`get_carbon_price`, Cell 12)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Carbon revenue earned per tonne of CO₂e avoided depends on country economic classification and sector.
            Under <em>Current policies</em>, each nation earns its domestic ETS/tax price (`COUNTRY_INFO[c].price_now`), while Agriculture earns a flat voluntary carbon credit of US$5/t.
            Under forward IEA scenarios, prices are split into Advanced vs Emerging tiers. Because biological agricultural offsets face liquidity discounts, agricultural projects receive 25% of the prevailing carbon price (`AGRI_PRICE_SHARE = 0.25`).
          </p>
          <pre className="bg-slate-900 text-slate-200 text-xs p-3.5 rounded-lg overflow-x-auto font-mono">
{`if S == "Current policies":
    return VOLUNTARY_CREDIT_PRICE (5) if sector == "Agriculture" else COUNTRY_INFO[c].price_now
(adv, emg) = SCENARIO_PRICES[S]
price = adv if COUNTRY_INFO[c].group == "Advanced" OR forceAdvanced else emg
if sector == "Agriculture": price *= AGRI_PRICE_SHARE (0.25)`}
          </pre>
        </div>

        {/* Step 2: Project Economics */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            2. Project Economics & Abatement Cost (`project_economics` + `build_projects`, Cell 17)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The project universe spans 80 candidate investments across the 33 country–sector markets.
            For power projects (solar and wind), capital expenditure and power generation cash flows are calibrated to country-specific grid displacement and capacity factors.
            The annuity factor converts capital into annualized financing charges at discount rate `r`.
          </p>
          <pre className="bg-slate-900 text-slate-200 text-xs p-3.5 rounded-lg overflow-x-auto font-mono">
{`if spec.type == "power":
    mwh_per_kw    = 8.76 * capacity_factor
    tonnes_per_kw = mwh_per_kw * COUNTRY_INFO[c].grid
    capex_per_tpa = capex_per_kw / tonnes_per_kw
    benefit_per_t = (mwh_per_kw * POWER_PRICE_USD_MWH - om_share * capex_per_kw) / tonnes_per_kw
else:
    capex_per_tpa = spec.capex_per_tpa ; benefit_per_t = spec.benefit_per_t

rate  = COUNTRY_INFO[c].discount ; if emergingRate != null and c ∈ EMERGING_FOCUS: rate = emergingRate
price = carbonPrice(c, s, S, forceAdvanced = emergingFullPrice && c ∈ EMERGING_FOCUS)
af    = (1 - (1+rate)^(-life)) / rate
max_tpa = reach * Forecast_2030_Mt[c,s] * 1e6

Abatement_cost_per_t = capex_per_tpa / af - benefit_per_t
Tonnes_per_USDm      = 1e6 / capex_per_tpa
NPV_per_USD          = (benefit_per_t + price) * af / capex_per_tpa - 1
Annual_cash_per_USD  = (benefit_per_t + price) / capex_per_tpa
Max_Mt = max_tpa / 1e6 ; Max_invest_USDm = max_tpa * capex_per_tpa / 1e6`}
          </pre>
        </div>

        {/* Step 3: Linear Programming */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            3. Linear Programming Formulation (`optimise_portfolio`, Cell 18)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The fund allocates capital `xᵢ` (US$m) across all 80 candidate projects.
            In return mode, the solver maximises total NPV subject to delivering at least the user-defined annual abatement target.
            In impact mode, it maximises total CO₂e avoided with a small tie-breaker weighting higher-priority markets.
          </p>
          <pre className="bg-slate-900 text-slate-200 text-xs p-3.5 rounded-lg overflow-x-auto font-mono">
{`Variables: 0 ≤ xᵢ ≤ Max_invest_USDm_i  (for each candidate project i)

Maximise:
  Return Mode:  Σ NPV_per_USD_i · xᵢ
  Impact Mode:  Σ (Tonnes_per_USDm_i / 1e6 · 1000 + 0.001 · Priority_Score_i / 100) · xᵢ

Subject To:
  Total Budget:           Σ xᵢ ≤ B
  Country Risk Limit:     Σ_{c} xᵢ ≤ MAX_COUNTRY_SHARE · B   (for each country c)
  Technology Risk Limit:  Σ_{tech} xᵢ ≤ MAX_PROJECT_SHARE · B (for each project type)
  Sector Minimum Floor:   Σ_{s} xᵢ ≥ MIN_SECTOR_SHARE · B    (for each sector s)
  Impact Target:          Σ (Tonnes_per_USDm_i / 1e6) · xᵢ ≥ target  (return mode only)`}
          </pre>
        </div>
      </section>

      {/* Model Assumption Tables */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">
          Model Parameter Tables
        </h2>

        {/* Countries Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            Country Calibration Parameters (`COUNTRY_INFO`)
          </h3>
          <div className="overflow-x-auto table-scrollbar">
            <table className="min-w-full text-xs text-left divide-y divide-slate-200">
              <thead className="bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-2 px-3">Country</th>
                  <th className="py-2 px-3">Classification</th>
                  <th className="py-2 px-3 text-right">Current Carbon Price ($/t)</th>
                  <th className="py-2 px-3 text-right">Cost of Capital (Discount Rate)</th>
                  <th className="py-2 px-3 text-right">Grid Emission Factor (t CO₂/MWh)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {Object.entries(COUNTRY_INFO).map(([c, info]: [string, any]) => (
                  <tr key={c} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                      {c}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          info.group === "Advanced"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {info.group}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      ${info.price_now.toFixed(0)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {(info.discount * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 px-3 text-right">
                      {info.grid.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interventions Catalogue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            Interventions Catalogue (`INTERVENTIONS`)
          </h3>
          <div className="overflow-x-auto table-scrollbar">
            <table className="min-w-full text-xs text-left divide-y divide-slate-200">
              <thead className="bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-2 px-3">Project Intervention</th>
                  <th className="py-2 px-3">Sector</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3 text-right">Capex ($ / tpa or $/kW)</th>
                  <th className="py-2 px-3 text-right">Economic Life (yrs)</th>
                  <th className="py-2 px-3 text-right">Market Reach %</th>
                  <th className="py-2 px-3 text-right">Operational Benefit ($/t)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {Object.entries(INTERVENTIONS).map(([name, spec]: [string, any]) => (
                  <tr key={name} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                      {name}
                      {spec.countries && (
                        <span className="block text-[10px] text-slate-500 font-normal">
                          Restricted: {spec.countries.join(", ")}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-700">
                      {spec.sector}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-500">
                      {spec.type}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      ${spec.type === "power" ? spec.capex_per_kw : spec.capex_per_tpa}
                    </td>
                    <td className="py-2 px-3 text-right">{spec.life} yrs</td>
                    <td className="py-2 px-3 text-right">
                      {(spec.reach * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 px-3 text-right">
                      {spec.benefit_per_t ? `$${spec.benefit_per_t}` : "Power Sales"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Limitations List (§8) */}
      <section className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
          <h2 className="text-lg font-bold">
            Methodological Limitations & Caveats (§8)
          </h2>
        </div>
        <ol className="space-y-2 text-xs sm:text-sm text-amber-950/90 list-decimal list-inside leading-relaxed">
          <li>
            <strong>National sector emissions ≠ company emissions:</strong> We use country-sector aggregates to quantify addressable systemic markets, never as an individual firm&apos;s corporate footprint.
          </li>
          <li>
            <strong>Sample coverage:</strong> The analysis encompasses 11 sovereign nations across 3 core sectors (Power Industry, Industrial Combustion, Agriculture). It excludes transport, buildings, and waste.
          </li>
          <li>
            <strong>Illustrative planning assumptions:</strong> Non-power capital costs, operational savings, and maximum &ldquo;reach&rdquo; shares are illustrative assumptions calibrated to IPCC AR6 Working Group III cost bands.
          </li>
          <li>
            <strong>Flat carbon prices:</strong> IEA 2035 scenario prices are held constant across each project&apos;s economic life rather than modeled as escalating real dynamic price trajectories.
          </li>
          <li>
            <strong>Agricultural offset discount:</strong> Soil carbon and methane avoidance credits are conservatively priced at 25% of headline industrial ETS prices to account for real-world MRV uncertainty.
          </li>
          <li>
            <strong>Simplified power economics:</strong> Electricity sales are held flat at US$50/MWh with standard capacity factors and grid-average carbon displacement rather than dynamic dispatch modeling.
          </li>
          <li>
            <strong>Linear trend forecasts:</strong> 2030 business-as-usual projections use 10-year linear trends (2015–2025) which do not model nonlinear policy shifts or technological tipping points.
          </li>
          <li>
            <strong>Linear continuous optimization:</strong> The model assumes capital can be invested in continuous decimal increments with zero fixed transaction costs or minimum ticket sizes.
          </li>
          <li>
            <strong>Descriptive and normative, not causal:</strong> Results indicate optimal strategic capital allocation under specified constraints, not econometric predictions of actual future market outcomes.
          </li>
        </ol>
      </section>

      {/* Official Data Sources & External Links */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-700" />
            <h2 className="text-lg font-bold text-slate-900">
              Official Primary Sources & Citations
            </h2>
          </div>
          <span className="text-xs text-slate-400">8 Institutional References</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {externalLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-slate-50 transition group"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 block group-hover:text-teal-900">
                  {link.name}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {link.org}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0 ml-2" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
