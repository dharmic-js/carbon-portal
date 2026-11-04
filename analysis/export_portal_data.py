"""
export_portal_data.py
=====================
Runs the project notebook code (IPP_PROJECT_FINAL_simplified.py) exactly as
written, then exports the numbers the web portal needs as JSON files.

Why: every chart and number on the portal can be traced back to a notebook
cell. The portal never invents data — it either reads these JSON files or
re-runs the same formulas (documented cell by cell) in the browser.

Usage (from the repository root):
    pip install -r analysis/requirements.txt
    python analysis/export_portal_data.py

Inputs : data/EDGAR_sector_emissions_project_dataset.csv
         analysis/IPP_PROJECT_FINAL_simplified.py
Outputs: data/part_a_charts.json      (Part A historical charts, Cells 4–10)
         data/markets.json            (Part B market data, Cells 12–16)
         data/model_assumptions.json  (Cell 11 control panel + assumptions)
         data/reference_results.json  (expected optimizer results, for tests)
"""

import json
import os
import re
import sys
import tempfile
import types

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOTEBOOK_PY = os.path.join(ROOT, "analysis", "IPP_PROJECT_FINAL_simplified.py")
DATASET = os.path.join(ROOT, "data", "EDGAR_sector_emissions_project_dataset.csv")
OUT_DIR = os.path.join(ROOT, "data")


# ---------------------------------------------------------------------------
# 1. Stand-ins for Colab / Jupyter-only features so the notebook runs as a script
# ---------------------------------------------------------------------------
class _ColabFiles:
    def upload(self):
        name = os.path.basename(DATASET)
        with open(DATASET, "rb") as f:
            content = f.read()
        with open(name, "wb") as f:          # notebook reads the file from the working folder
            f.write(content)
        return {name: content}

    def download(self, path):
        pass                                 # nothing to download when running as a script


google = types.ModuleType("google")
colab = types.ModuleType("google.colab")
colab.files = _ColabFiles()
google.colab = colab
sys.modules["google"] = google
sys.modules["google.colab"] = colab

try:
    from IPython.display import display, HTML  # noqa: F401
except ImportError:                          # allow running without IPython installed
    ipy = types.ModuleType("IPython")
    ipy_display = types.ModuleType("IPython.display")
    ipy_display.display = lambda *a, **k: None
    ipy_display.HTML = lambda x: x
    sys.modules["IPython"] = ipy
    sys.modules["IPython.display"] = ipy_display

import matplotlib
matplotlib.use("Agg")                        # draw charts off-screen


# ---------------------------------------------------------------------------
# 2. Run the notebook code
# ---------------------------------------------------------------------------
def run_notebook():
    source = open(NOTEBOOK_PY, encoding="utf-8").read()
    source = re.sub(r"^!pip.*$", "", source, flags=re.M)       # shell command, not Python
    source = source.replace("plt.show()", "plt.close('all')")   # don't open windows
    source = source.replace("fig.show()", "pass")
    source = "from IPython.display import display, HTML\n" + source
    namespace = {"__name__": "__notebook__"}
    workdir = tempfile.mkdtemp()
    cwd = os.getcwd()
    os.chdir(workdir)                       # notebook writes its Excel/txt exports here
    try:
        import contextlib, io
        with contextlib.redirect_stdout(io.StringIO()):
            exec(compile(source, NOTEBOOK_PY, "exec"), namespace)
    finally:
        os.chdir(cwd)
    return namespace


def clean(obj):
    """Make numpy / pandas values JSON-friendly."""
    import numpy as np
    import pandas as pd
    if isinstance(obj, dict):
        return {str(k): clean(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [clean(v) for v in obj]
    if isinstance(obj, pd.DataFrame):
        return clean(obj.to_dict(orient="records"))
    if isinstance(obj, pd.Series):
        return clean(obj.to_dict())
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating, float)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return round(float(obj), 6)
    if isinstance(obj, np.bool_):
        return bool(obj)
    return obj


def main():
    g = run_notebook()
    pd = g["pd"]
    np = g["np"]
    df = g["df_clean"]

    # -----------------------------------------------------------------------
    # Part A — historical charts (Cells 4–10)
    # -----------------------------------------------------------------------
    sector_year = df.groupby(["Sector", "Year"])["Emissions_Mt_CO2eq"].sum().reset_index()
    latest = g["latest_data"]
    rank_data = g["rank_data"]
    change = g["change_data"]
    race = g["race_data"]

    part_a = {
        "_about": "Data behind the Part A (historical) charts. Each key names the notebook cell that draws the chart.",
        "dataset": {"rows": int(len(df)), "countries": sorted(df["Country"].unique()),
                    "sectors": sorted(df["Sector"].unique()),
                    "first_year": int(df["Year"].min()), "last_year": int(df["Year"].max()),
                    "unit": "Mt CO2e (million tonnes of CO2-equivalent)",
                    "source": "EDGAR Community GHG Database (EDGAR_2026_GHG), European Commission JRC"},
        "cell3_quality_table": g["quality"],
        "cell4_sector_dashboard": {
            "year": g["latest_year"],
            "kpis": {"leading_sector": g["leading_sector"], "leading_value_mt": g["leading_value"],
                     "leading_share_pct": g["leading_share"]},
            "sectors": g["sector_table"],
            "charts": "Donut (sector share) + ranked horizontal bar (emissions by sector)",
        },
        "cell5_country_comparison": {
            "year": g["latest_year"],
            "rows": latest[["Country", "Sector", "Emissions_Mt_CO2eq"]],
            "charts": "Faceted bar chart: one panel per sector, countries on x-axis, independent y-axes",
        },
        "cell6_treemap": {
            "year": g["latest_year"],
            "rows": latest[["Sector", "Country", "Emissions_Mt_CO2eq"]],
            "charts": "Treemap Sector -> Country, area & colour = emissions (YlOrRd), text = label + % of parent",
        },
        "cell7_rankings": {
            "years": g["selected_years"],
            "rows": rank_data[["Country", "Sector", "Year", "Emissions_Mt_CO2eq", "Rank"]],
            "charts": "Bump chart per sector, rank 1 at top, country labels at 2025",
        },
        "cell8_power_change_1990_2025": {
            "rows": change[["Country", "Emissions_1990", "Emissions_2025", "Change"]],
            "charts": "Diverging horizontal bars sorted by change; red = increase, teal = decrease",
        },
        "cell9_sector_trends": {
            "rows": sector_year,
            "charts": "Small multiples: one line + area per sector, 1990–2025",
        },
        "cell10_power_race": {
            "rows": race,
            "charts": "Animated horizontal bar race of Power Industry emissions, one frame per year",
        },
    }

    # -----------------------------------------------------------------------
    # Part B — fixed market intelligence (Cells 12–16)
    # -----------------------------------------------------------------------
    profiles = g["profiles"]
    market_history = []
    for (country, sector), p in profiles.items():
        market_history.append({"Country": country, "Sector": sector,
                               "series": {int(y): float(v) for y, v in p.series.items()}})

    outlook_series = []
    for sector in sorted(df["Sector"].unique()):
        history = df[df["Sector"] == sector].groupby("Year")["Emissions_Mt_CO2eq"].sum()
        bau = []
        for year in range(g["BASE_YEAR"], g["FORECAST_YEAR"] + 1):
            total = sum(p.forecast(year) for (c, s), p in profiles.items() if s == sector)
            bau.append(total)
        bau[0] = float(history[g["BASE_YEAR"]])
        target = float(history[2019]) * (1 - g["PATHWAY_CUT_2030"])
        pathway = list(np.linspace(history[g["BASE_YEAR"]], target, len(bau)))
        outlook_series.append({"Sector": sector,
                               "history": {int(y): float(v) for y, v in history.items()},
                               "years_ahead": list(range(g["BASE_YEAR"], g["FORECAST_YEAR"] + 1)),
                               "bau": bau, "pathway": pathway})

    markets = {
        "_about": "Market-level results that do not depend on the fund's settings (notebook Cells 12–16).",
        "cell12_market_profiles": g["scorecard"][["Country", "Sector", "Emissions_2025_Mt", "Growth_10y_pct",
                                                   "Peak_Year", "Below_Peak_pct", "Volatility_pct",
                                                   "Forecast_2030_Mt", "Momentum"]],
        "cell12_market_history": market_history,
        "cell13_economic_context": {"source_used": g["econ_source"], "rows": g["econ"],
                                    "fallback_values": {k: {"population": v[0], "gdp_usd": v[1], "year": 2023}
                                                        for k, v in g["FALLBACK_ECON"].items()},
                                    "api_url_template": "https://api.worldbank.org/v2/country/{ISO3;ISO3;...}/indicator/{SP.POP.TOTL|NY.GDP.MKTP.CD}?format=json&mrv=1&per_page=100"},
        "cell14_scorecard": {"weights": g["WEIGHTS"], "size_threshold_mt": g["SIZE_THRESHOLD"],
                             "actions": g["ACTIONS"], "quadrant_colours": g["QUAD_COLOURS"],
                             "rows": g["scorecard"][["Country", "Sector", "Market", "Emissions_2025_Mt",
                                                     "Growth_10y_pct", "Peak_Year", "Below_Peak_pct",
                                                     "kg_per_USD_GDP", "Forecast_2030_Mt", "Momentum",
                                                     "Priority_Score", "Quadrant", "Recommended_Stance"]]},
        "cell15_outlook": {"pathway_cut_2030_vs_2019": g["PATHWAY_CUT_2030"], "table": g["outlook"],
                           "total_gap_mt": g["total_gap"], "series": outlook_series},
        "cell16_exposure": {"rows": g["exposure"], "total_now_usd_bn": g["total_now"],
                            "total_nze_usd_bn": g["total_nze"], "top_gap": g["top_gap"]},
    }

    # -----------------------------------------------------------------------
    # Cell 11 — control panel and assumptions
    # -----------------------------------------------------------------------
    assumptions = {
        "_about": "Everything defined in notebook Cell 11 (control panel). The portal's controls start at these defaults.",
        "defaults": {"BUDGET_USD_M": g["BUDGET_USD_M"], "TARGET_MT_PER_YEAR": g["TARGET_MT_PER_YEAR"],
                     "SCENARIO": g["SCENARIO"], "OBJECTIVE": g["OBJECTIVE"],
                     "MAX_COUNTRY_SHARE": g["MAX_COUNTRY_SHARE"], "MIN_SECTOR_SHARE": g["MIN_SECTOR_SHARE"],
                     "MAX_PROJECT_SHARE": g["MAX_PROJECT_SHARE"]},
        "control_ranges": {"BUDGET_USD_M": {"min": 1000, "max": 80000, "step": 1000},
                           "TARGET_MT_PER_YEAR": {"min": 0, "max": 200, "step": 1},
                           "SCENARIO": list(g["SCENARIO_PRICES"].keys()),
                           "OBJECTIVE": ["Maximise financial return (NPV)", "Maximise CO2e avoided"],
                           "MAX_COUNTRY_SHARE": {"min": 0.1, "max": 1.0, "step": 0.05},
                           "MIN_SECTOR_SHARE": {"min": 0.0, "max": 0.33, "step": 0.01},
                           "MAX_PROJECT_SHARE": {"min": 0.1, "max": 1.0, "step": 0.05}},
        "constants": {"BASE_YEAR": g["BASE_YEAR"], "FORECAST_YEAR": g["FORECAST_YEAR"],
                      "TREND_WINDOW": g["TREND_WINDOW"], "AGRI_PRICE_SHARE": g["AGRI_PRICE_SHARE"],
                      "VOLUNTARY_CREDIT_PRICE": g["VOLUNTARY_CREDIT_PRICE"],
                      "POWER_PRICE_USD_MWH": g["POWER_PRICE_USD_MWH"],
                      "EMERGING_FOCUS": g["EMERGING_FOCUS"]},
        "COUNTRY_INFO": g["COUNTRY_INFO"],
        "SCENARIO_PRICES": {k: (None if v is None else {"Advanced": v[0], "Emerging": v[1]})
                            for k, v in g["SCENARIO_PRICES"].items()},
        "INTERVENTIONS": {name: {k: (sorted(v) if isinstance(v, set) else v) for k, v in spec.items()}
                          for name, spec in g["INTERVENTIONS"].items()},
        "DATA_SOURCES": [{"item": a, "source": b} for a, b in g["DATA_SOURCES"]],
        "market_inputs": g["scorecard"][["Country", "Sector", "Forecast_2030_Mt", "Priority_Score",
                                         "Emissions_2025_Mt"]],
    }

    # -----------------------------------------------------------------------
    # Reference results — what the optimizer must return (used for portal tests)
    # -----------------------------------------------------------------------
    build_projects = g["build_projects"]
    optimise = g["optimise_portfolio"]
    metrics = g["portfolio_metrics"]
    OptErr = g["OptimisationError"]
    defaults = assumptions["defaults"]

    def run_case(name, **settings):
        s = dict(defaults)
        s.update(settings)
        for key in ["MAX_COUNTRY_SHARE", "MIN_SECTOR_SHARE", "MAX_PROJECT_SHARE"]:
            g[key] = s[key]                                  # functions read these globals
        projects = build_projects(s["SCENARIO"])
        try:
            plan = optimise(projects, s["BUDGET_USD_M"], s["OBJECTIVE"], s["TARGET_MT_PER_YEAR"])
            status = "All constraints satisfied"
        except OptErr:
            plan = optimise(projects, s["BUDGET_USD_M"], "Maximise CO2e avoided", 0)
            status = "Target infeasible – showing max-impact plan"
        k = metrics(plan)
        robust = []
        for scenario in g["SCENARIO_PRICES"]:
            priced = build_projects(scenario)
            same = plan[["Country", "Sector", "Project", "Invest_USDm"]].merge(priced, on=["Country", "Sector", "Project"])
            m = metrics(same)
            robust.append({"Scenario": scenario, "NPV_USD_bn": m["NPV_USDm"] / 1000,
                           "ROI_pct": m["ROI_pct"], "Payback_years": m["Payback_years"]})
        result = {"name": name, "settings": s, "status": status, "kpi": k,
                  "target_met": bool(k["Mt_avoided_per_year"] >= s["TARGET_MT_PER_YEAR"] - 0.01),
                  "by_country_usdm": plan.groupby("Country")["Invest_USDm"].sum(),
                  "by_sector_usdm": plan.groupby("Sector")["Invest_USDm"].sum(),
                  "by_project_usdm": plan.groupby("Project")["Invest_USDm"].sum(),
                  "plan": plan[["Country", "Sector", "Project", "Invest_USDm"]],
                  "robustness": robust,
                  "n_projects_in_universe": len(projects)}
        for key in ["MAX_COUNTRY_SHARE", "MIN_SECTOR_SHARE", "MAX_PROJECT_SHARE"]:
            g[key] = defaults[key]
        return result

    cases = [
        run_case("default"),
        run_case("impact_objective", OBJECTIVE="Maximise CO2e avoided"),
        run_case("net_zero_prices", SCENARIO="Net zero (IEA NZE)"),
        run_case("current_prices", SCENARIO="Current policies"),
        run_case("big_budget", BUDGET_USD_M=20000, TARGET_MT_PER_YEAR=45),
        run_case("impossible_target", TARGET_MT_PER_YEAR=100),
        run_case("loose_limits", MAX_COUNTRY_SHARE=1.0, MIN_SECTOR_SHARE=0.0, MAX_PROJECT_SHARE=1.0),
    ]

    default_projects = build_projects(defaults["SCENARIO"])
    reference = {
        "_about": ("Expected results computed by the notebook (scipy linprog, HiGHS). A JavaScript port must "
                   "reproduce kpi values within tolerance: Mt ±0.05, NPV ±0.5%, Invested ±1 US$m. "
                   "Per-project allocations may differ only where two projects are exactly tied."),
        "projects_default_scenario": default_projects,
        "projects_by_scenario_summary": {sc: {"n": len(build_projects(sc)),
                                              "sum_max_mt": float(build_projects(sc)["Max_Mt"].sum()),
                                              "mean_npv_per_usd": float(build_projects(sc)["NPV_per_USD"].mean())}
                                         for sc in g["SCENARIO_PRICES"]},
        "cases": cases,
        "default_extras": {
            "strategy_comparison": g["comparison"].reset_index(),
            "uplift_vs_equal_split": g["uplift"],
            "frontier": g["frontier"],
            "levers": g["finance_test"],
            "recommendations": g["recommendations"],
            "company_lens_default": {"inputs": {"COMPANY_NAME": g["COMPANY_NAME"], "COMPANY_COUNTRY": g["COMPANY_COUNTRY"],
                                                "COMPANY_SECTOR": g["COMPANY_SECTOR"],
                                                "COMPANY_EMISSIONS_MT": g["COMPANY_EMISSIONS_MT"],
                                                "COMPANY_CUT_PCT": g["COMPANY_CUT_PCT"]},
                                     "required_rate_pct": g["required_rate"],
                                     "national_cagr_pct": g["market"].cagr_recent(),
                                     "carbon_bill": g["company_exposure"], "options": g["options"]},
        },
    }

    outputs = {"part_a_charts.json": part_a, "markets.json": markets,
               "model_assumptions.json": assumptions, "reference_results.json": reference}
    for filename, payload in outputs.items():
        path = os.path.join(OUT_DIR, filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(clean(payload), f, indent=1, ensure_ascii=False)
        print(f"wrote {path} ({os.path.getsize(path) / 1024:,.0f} KB)")


if __name__ == "__main__":
    main()
