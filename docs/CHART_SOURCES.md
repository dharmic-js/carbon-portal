# Chart Source Map — where every chart on the portal comes from

Every chart on the portal is either:

- **Historical (Part A):** a rebuild of a chart in our Colab notebook (Cells 4–10). It uses the exact numbers the notebook calculated, exported to `data/part_a_charts.json` by `analysis/export_portal_data.py`.
- **Live (Part B):** calculated in the browser when you move the controls. It uses the same formulas as the notebook cell named in the table, and the starting assumptions come from `data/model_assumptions.json`. Five Part B results are drawn as graphs (B1–B5).

Raw data: `data/EDGAR_sector_emissions_project_dataset.csv`. This is the EDGAR Community GHG Database (EDGAR_2026_GHG), published by the European Commission Joint Research Centre. It covers 11 countries, 3 sectors and the years 1990–2025, in Mt CO₂e.

## Part A — Historical analysis (static, from the notebook)

| # | Portal chart | Notebook cell | What it shows | Data file → key |
|---|---|---|---|---|
| A1 | Data-quality table | Cell 3 | Rows, countries, sectors, years, duplicates, missing values | `part_a_charts.json → cell3_quality_table` |
| A2 | KPI cards + sector donut + sector bar (2025) | Cell 4 | Power Industry is 59.8% of 2025 emissions | `cell4_sector_dashboard` |
| A3 | Country comparison by sector (faceted bars, 2025) | Cell 5 | Which countries emit most in each sector | `cell5_country_comparison` |
| A4 | Treemap sector → country (2025) | Cell 6 | Where emissions come from | `cell6_treemap` |
| A5 | Ranking changes 1990 / 2010 / 2025 (bump chart) | Cell 7 | How country ranks moved | `cell7_rankings` |
| A6 | Change in power emissions 1990–2025 (diverging bars) | Cell 8 | Who increased and who cut | `cell8_power_change_1990_2025` |
| A7 | Sector trends 1990–2025 (small multiples) | Cell 9 | Long-run trend of each sector | `cell9_sector_trends` |
| A8 | Power-sector bar-chart race (animated) | Cell 10 | Year-by-year ranking of power emitters | `cell10_power_race` |

## Part B — Investment simulator (all of its logic is on the site; 5 graphs)

All Part B calculations from notebook Cells 11–23 run on the portal. **Five Part B results are shown as graphs**, in story order. Everything else is shown as tables, KPI cards or text.

| # | Portal element | Shown as | Logic from notebook cell | Fixed data (JSON) or live? |
|---|---|---|---|---|
| B1 | **Market priority matrix**: growth vs size, bubble = priority score, colour = quadrant | **📊 Graph** | Cell 14 | Fixed: `markets.json → cell14_scorecard` |
| B2 | **Marginal abatement cost curve (MACC)**: every project by cost per tonne | **📊 Graph** | Cell 17 (`build_projects`) | **Live** (changes with scenario) |
| B3 | **"Where the money goes"**: US$ per country + Mt avoided per project type | **📊 Graph** | Cells 18 & 21 | **Live** |
| B4 | **Strategy comparison**: equal split vs biggest emitters vs optimised | **📊 Graph** | Cell 19 | **Live** |
| B5 | **"Carbon-price risk"**: NPV of the same plan under today's prices / pledges / net zero | **📊 Graph** | Cell 20 | **Live** |
| — | Control panel (budget, target, scenario, objective, limits) | Controls | Cell 11 | Defaults from `model_assumptions.json → defaults` |
| — | Market profiles (33 markets) | Table | Cell 12 (`MarketProfile` class) | Fixed: `markets.json → cell12_market_profiles` |
| — | Emissions per person and per US$ GDP | Table | Cell 13 (World Bank API) | Live API, with stored fallback in `markets.json → cell13_economic_context` |
| — | Priority scorecard table | Table | Cell 14 | Fixed: `markets.json → cell14_scorecard` |
| — | 2030 gap vs 1.5 °C path | Table + KPI | Cell 15 | Fixed: `markets.json → cell15_outlook` |
| — | Carbon exposure | Table + KPIs | Cell 16 | Fixed: `markets.json → cell16_exposure` |
| — | Recommended plan, KPI cards | Table + KPIs | Cell 18 (`optimise_portfolio`, `portfolio_metrics`) | **Live** |
| — | Budget frontier, financing levers | Tables | Cell 20 | **Live** |
| — | Auto-recommendations | Text | Cell 21 | **Live** |
| — | Company lens | KPIs + tables | Cell 22 | **Live** |
| — | Downloads (plan CSV, assumptions, sources) | Buttons | Cell 23 | **Live** export |

## How to check a number

1. Open `analysis/IPP_PROJECT_FINAL_simplified.ipynb` in Google Colab and run all cells.
2. Find the cell listed above and compare its output with the portal.
3. Alternatively, run `python analysis/export_portal_data.py`. It re-creates every JSON file from the notebook code.
4. The portal's automated tests (`npm test`) check the browser optimizer against `data/reference_results.json`. That file holds results computed by the notebook's own SciPy optimizer for 7 scenarios.
