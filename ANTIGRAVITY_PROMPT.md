# Build prompt: "Carbon Strategy & Investment Optimizer" web portal

You are building an interactive web portal for a university Applied Python business-analytics project. Then you will publish it to a new GitHub repository and deploy it on Vercel.

Read this whole prompt and every file in this workspace before writing code. Ask me before deviating from anything marked **MUST**.

---

## 0. What the project is (context)

- **Data:** EDGAR greenhouse-gas emissions for 11 countries (Australia, Brazil, Canada, China, Germany, India, Indonesia, Japan, South Africa, United Kingdom, United States). It covers 3 sectors (Power Industry, Industrial Combustion, Agriculture) and the years 1990–2025. That is 1,188 rows, with emissions in **Mt CO₂e** (million tonnes of CO₂-equivalent).
- **Approved problem statement:** How have emissions changed across Agriculture, Industrial Combustion and Power Industry in 11 countries from 1990 to 2025, and which sectors and countries should be prioritised for decarbonisation?
- **Part A (notebook Cells 1–10): historical analysis.** Data cleaning plus 7 charts showing what happened.
- **Part B (notebook Cells 11–23): the business application.** An illustrative **climate investment fund with US$10 billion** decides which decarbonisation projects to fund in which of the 33 country–sector "markets". A linear-programming optimizer maximises financial value (NPV) while avoiding at least 25 Mt CO₂e a year. Risk limits apply: max 30% of the budget per country, max 30% per technology, min 20% per sector. Stress tests cover carbon prices, budget size and financing levers.
- **Key caveat (MUST be visible on the site):** national sector emissions are **not** company emissions. We use them to size markets and opportunities, never as a company's own footprint. The fund is illustrative, and non-power project costs are planning assumptions.

**The portal's job:** let a professor or manager (1) see the historical analysis exactly as in our notebook, **with all the Part A graphs**, and (2) play with the US$10 bn fund. The fund part shows the full Part B logic but **only five Part B graphs**; everything else is tables and KPIs. In the fund part they can change the budget, target, carbon-price scenario, objective and risk limits, and instantly see the recommended allocation, returns, risks and recommendations.

---

## 1. Files in this workspace (the source of truth)

| File | Purpose |
|---|---|
| `analysis/IPP_PROJECT_FINAL_simplified.ipynb` / `.py` | **The original Python notebook. It is the single source of truth for every formula and chart.** Each code line is commented. |
| `analysis/export_portal_data.py` | Runs the notebook code and exports the JSON files below. Do not change the numbers by hand; re-run this script if data must change. |
| `data/EDGAR_sector_emissions_project_dataset.csv` | Raw dataset (offer as a download). |
| `data/part_a_charts.json` | Exact data behind each Part A chart, keyed by notebook cell (`cell4_…` to `cell10_…`). |
| `data/markets.json` | Part B market data that doesn't depend on the controls (Cells 12–16): profiles, yearly history, World Bank fallback values, priority scorecard, 2030 outlook series, carbon exposure. |
| `data/model_assumptions.json` | Cell 11 control panel: defaults, control ranges, `COUNTRY_INFO`, `SCENARIO_PRICES`, `INTERVENTIONS`, constants, `DATA_SOURCES`, plus `market_inputs` (Forecast_2030_Mt, Priority_Score and Emissions_2025_Mt for the 33 markets). |
| `data/reference_results.json` | Expected optimizer results computed by the notebook (SciPy HiGHS) for 7 scenarios, plus default strategy comparison, budget frontier, levers, recommendations and company lens. **Use it for automated tests.** |
| `docs/CHART_SOURCES.md` | Map of every portal chart to its notebook cell. **MUST be reproduced as a page on the site.** |
| `docs/IPP_Project_Report_Final.docx` | Final written report (offer as a download). |
| `README.md` | Draft README for the GitHub repo (update the live link after deploying). |

**MUST:** never invent or hard-code a number in page text. Every number shown comes from the JSON files or is computed at runtime by the formulas in §5.

---

## 2. Tech stack (MUST unless a blocker; tell me if you change it)

- **Next.js 14+ (App Router) + TypeScript + Tailwind CSS**, deployable on Vercel with zero configuration. No backend server or database: everything runs in the browser from the JSON files.
- **Charts:** `react-plotly.js` + `plotly.js-dist-min`, loaded with `next/dynamic` and `{ ssr: false }`. Plotly is needed for the Part A treemap, faceted bars and animated race, and it matches the notebook visually. Use it for the five Part B charts too.
- **Optimizer in the browser:** `javascript-lp-solver` (pure JS, no WASM). If it cannot pass the reference tests in §7, switch to `highs` (HiGHS compiled to WASM, the same solver SciPy uses). Serve its `.wasm` file from `/public`.
- **Tests:** `vitest`.
- Put the JSON files in `/data` at the repo root and import them at build time. Copy the CSV, the notebook (`.ipynb`) and the report (`.docx`) into `/public/downloads/` for download links.

---

## 3. Site structure (pages and what goes on each)

Use a clean, professional, minimal look: white background, navy `#172554` / teal `#164e63` / green `#365314` accents (the notebook's KPI card colours), Inter or a similar sans-serif font, generous spacing. It MUST be responsive down to phone width (charts stack vertically; no horizontal page scroll). Add a top navigation bar with these pages:

### 3.1 Home (`/`)
- Title: **"Carbon Strategy & Investment Optimizer"**. Subtitle: "Global sectoral GHG emissions 1990–2025 → where should a US$10 bn climate fund invest?"
- Problem statement (verbatim from §0) and a 3-step explainer: *What happened (Part A) → Which markets matter (market intelligence) → Where to invest (simulator)*.
- 4 headline KPI cards, read from the JSON:
  - Power Industry share of 2025 emissions (`part_a_charts.cell4_sector_dashboard.kpis`)
  - 2030 gap to the 1.5 °C path (`markets.cell15_outlook.total_gap_mt`)
  - Default plan's Mt avoided per year and NPV (`reference_results.cases[0].kpi`)
- The "national ≠ company emissions" caveat box.
- Buttons: "Explore the history" and "Open the fund simulator".

### 3.2 Historical Analysis (`/history`): Part A, notebook Cells 3–10
**MUST rebuild these charts faithfully: same chart types, same data, same ordering and colours.** Make them interactive with hover tooltips. Each chart sits in a card with:
- **Title**
- **Source caption:** *"Source: project notebook, Cell N · Data: EDGAR_2026_GHG (European Commission JRC)"*
- **2–3 sentence insight**, built from the JSON values at runtime

Charts:
1. **Cell 3:** data-quality table (`cell3_quality_table`).
2. **Cell 4:** 3 KPI cards (leading sector, its emissions, its share), a donut of sector shares (pie with a hole of about 0.42, % labels, colours blue `#4C72B0`, orange `#DD8452`, green `#55A868`) and a ranked horizontal bar of emissions by sector (viridis colours, value labels).
3. **Cell 5:** faceted bar chart, one panel per sector stacked vertically, countries on the x-axis with tilted labels, **independent y-axes per panel**, Plotly default colours per sector.
4. **Cell 6:** treemap Sector → Country, area and colour = emissions, colour scale YlOrRd, text = label + % of parent.
5. **Cell 7:** bump chart, one panel per sector, years 1990/2010/2025, rank 1 at the top (reversed y-axis), lines with markers, country labels at 2025.
6. **Cell 8:** diverging horizontal bars of the change in Power Industry emissions 1990→2025, sorted ascending. Red `#D9534F` = increase, teal `#2A9D8F` = decrease, with signed value labels and a zero line.
7. **Cell 9:** small multiples, one line + light area per sector (colour `#247BA0`), 1990–2025.
8. **Cell 10:** animated bar-chart race of Power Industry emissions by country, with a play/pause button and year slider (about 700 ms per frame). Biggest emitter at the top, fixed x-range 0 to 1.15 × max.

Optional controls are fine (e.g. a sector dropdown on charts 3/5, a year slider on 4), but the default view MUST equal the notebook chart.

### ⚠️ Graph policy for Part B (MUST, the faculty's requirement)
The **whole project** must be on the portal: all Part A analysis **and** all Part B business logic (every calculation in notebook Cells 11–23). But **graphs** are limited:
- **Part A:** all of its charts (§3.2).
- **Part B:** **exactly five charts** in the whole site, in this story order:
  - **B1 Market priority matrix** (§3.3, Cell 14): which markets matter most
  - **B2 Marginal abatement cost curve** (§3.4, Cell 17): which projects are cheapest and which pay for themselves
  - **B3 "Where the money goes"** (§3.4, Cells 18 & 21): the recommended allocation
  - **B4 Strategy comparison** (§3.4, Cell 19): proof that optimisation beats simple rules
  - **B5 "Carbon-price risk"** (§3.4, Cell 20): does the plan still make money if carbon prices don't rise?
- Every other Part B result is shown as **KPI cards, sortable tables, short text or the auto-written recommendations. No other Part B charts.** Do not add sparklines, mini-charts or decorative graphs for Part B.

### 3.3 Market Intelligence (`/markets`): Cells 12–16 (fixed data; one chart, B1, the rest tables and KPIs)
Caption each block with *"Logic: notebook Cell N"*.
1. **Market profiles (Cell 12):** a sortable, searchable table of the 33 markets with columns Market, 2025 Mt, 10-yr growth %, peak year, % below peak, volatility, 2030 forecast, momentum.
2. **Fair comparison (Cell 13, World Bank API):** a table of the 11 countries with population, GDP (US$ bn), 2025 emissions (3 sectors), tonnes per person and kg per US$ GDP, sortable.
   - Try a **live** fetch from the World Bank API using the template in `markets.cell13_economic_context.api_url_template` (one call for `SP.POP.TOTL`, one for `NY.GDP.MKTP.CD`, all 11 ISO3 codes joined with `;`, response `[metadata, rows]`).
   - If it fails (CORS, timeout of about 10 s, missing country), use `fallback_values`.
   - Show a badge: "Live: World Bank API" or "Stored values (World Bank 2023)".
   - Note under the table that the priority scores use the stored values, so they match the notebook.
3. **📊 Chart B1, Market priority matrix (Cell 14).**
   - A bubble chart: x = 10-yr growth % (`Growth_10y_pct`), y = 2025 Mt on a **log scale**, bubble size = priority score, colour = quadrant (`quadrant_colours`).
   - Dashed grey lines at x = 0.5 and y = `size_threshold_mt` split the four quadrants.
   - Label the top 5 markets "#1 China – Power Industry", "#2 …" etc. (text above the bubble). Hover shows market, score, growth, peak year and 2025 Mt.
   - Legend below the chart.
   - Caption: *"Source: notebook Cell 14 — priority score = 40% size + 30% growth + 15% near peak + 15% emissions per US$ GDP (percentile ranks)"*.

   Below the chart, the **priority scorecard table**: rank, market, 2025 Mt, growth %, peak year, priority score, quadrant (coloured pill) and recommended stance. Add a short explainer of the four quadrants with a count of markets in each.
4. **2030 gap (Cell 15):** a table per sector (2019, 2025, 2030 trend, 2030 1.5 °C path, gap), a total-gap KPI card, and the sentence "The fund's target is X% of the gap", where X is computed from the current target.
5. **Carbon exposure (Cell 16):** 3 KPI cards (priced today, potential under net zero, largest repricing risk) and a table of the 33 markets (today, announced pledges, net zero, repricing gap in US$ bn), sorted by repricing gap. Note that a 0 today means no carbon price.

### 3.4 Fund Simulator (`/simulator`): Cells 11 and 17–21, the core of Part B, fully live
**Layout:** a sticky control panel on the left (top on mobile), results on the right. Every result recalculates when a control changes (debounce about 150 ms). Show a small "Recalculating…" state while it works.

**Controls (Cell 11):** use the defaults and ranges from `model_assumptions.json`.
- Budget slider: US$1–80 bn, shown in US$ bn.
- Target slider: Mt/yr.
- Scenario: segmented control with 3 options and a one-line explanation of each.
- Objective: toggle "Max return (NPV)" / "Max CO₂ avoided".
- Max share per country, min share per sector, max share per technology: sliders.

Add **preset buttons:** Default · Impact-first · Net-zero prices · Today's prices · US$20 bn / 45 Mt · Loose limits. These are the settings of the 7 reference cases. Add a "Reset to notebook defaults" button.

**Results, in this order:**
1. **Status banner.** "All constraints satisfied" (green), or, if the target is impossible, the amber message "Target infeasible – showing max-impact plan" (§5.4).
2. **KPI cards:** Invest (US$ bn), CO₂e avoided (Mt/yr) with lifetime Mt, NPV (US$ bn), ROI % · payback years, Target MET/NOT MET (green or red), and "NPV at today's carbon prices" (the downside case).
3. **📊 Chart B2, Marginal abatement cost curve, MACC (Cell 17).**
   - Sort all projects for the chosen scenario by `Abatement_cost_per_t`, cheapest first.
   - Draw one bar per project: **width = `Max_Mt`**, **height = net cost per tonne**, placed side by side (x start = cumulative `Max_Mt` of the bars before it). Colour by sector (Power `#F4A261`, Industrial Combustion `#2A9D8F`, Agriculture `#6A994E`). In Plotly, use a bar trace with `width` and `offset` arrays, or filled shapes.
   - Add a black zero line, and dashed horizontal lines at the advanced-economy and emerging-economy carbon prices of the chosen scenario, labelled. Draw no price lines for "Current policies".
   - X-axis: "Cumulative emissions the fund could avoid (Mt CO₂e per year)". Y-axis: "Net cost per tonne avoided (US$)".
   - Hover shows country, project, cost per tonne, max Mt and NPV per US$.
   - Above the chart, a KPI: "X Mt/yr of the Y Mt/yr available pays for itself even with no carbon price" (the sum of `Max_Mt` where the cost per tonne is < 0).
   - Caption: *"Live calculation — same formulas as notebook Cell 17. Cheapest on the left; bars below zero pay for themselves; bars below a price line pay for themselves at that carbon price."*

   Under the chart, a collapsible **full project table** (country, project, cost per tonne, tonnes per US$1m, NPV per US$, max Mt).
4. **📊 Chart B3, "Where the money goes" (Cells 18 & 21).** One figure with two side-by-side panels (stacked on mobile):
   - **Left:** horizontal bars of US$ bn invested per country, largest on top (colour `#247BA0`, value labels "US$ x.xx bn"), with a red dashed line at the country cap.
   - **Right:** horizontal bars of Mt CO₂e avoided per year by project type, coloured by sector (Power `#F4A261`, Industrial Combustion `#2A9D8F`, Agriculture `#6A994E`), with value labels "x.x Mt".
   - Caption: *"Live calculation — same formulas as notebook Cells 18 & 21"*.
5. **Plan table:** country, sector, project, US$m invested, max US$m, NPV per US$, and a totals row. Include a **Download plan as CSV** button. Under it, a small table of investment by sector.
6. **📊 Chart B4, Strategy comparison (Cell 19).**
   - Three small bar panels side by side (stacked on mobile), each with 4 bars: Equal split / Biggest emitters first / Optimised – impact / Optimised – return. Colours: `#95A5A6`, `#BDC3C7`, `#C0392B`, `#2A9D8F`.
   - Panel 1: Mt CO₂e avoided per year, with a dashed line at the target.
   - Panel 2: NPV (US$ bn).
   - Panel 3: capital needed per tonne/yr (US$).
   - Value labels on the bars. Add "(breaks limits)" under any strategy that breaks the risk limits.
   - Caption: *"Live calculation — same formulas as notebook Cell 19. Same budget, same projects."*

   Below it, the uplift sentence ("Optimised plan avoids X× more emissions than an equal split") and the full comparison table (Mt/yr, NPV, ROI %, payback, capital per t/yr, within risk limits).
7. **📊 Chart B5, "Carbon-price risk: the same plan in each scenario" (Cell 20).**
   - A bar chart with 3 bars: Today's prices / Pledges (APS) / Net zero (NZE). The height is the NPV (US$ bn) of **the current recommended plan** re-valued under each scenario.
   - Colour: teal `#2A9D8F` if NPV ≥ 0, red `#D9534F` if negative.
   - Labels "US$ x.x bn · ROI y%", and a zero line.
   - Caption: *"Live calculation — same formulas as notebook Cell 20"*.
8. **Other stress tests (Cell 20, tables, no charts):**
   - (a) Budget frontier for US$4–80 bn in US$4 bn steps (impact mode, target 0): a compact table of budget → Mt/yr → capital per t/yr, with the chosen budget's row highlighted.
   - (b) Financing levers: a 4-row table, Today's terms / Cheaper finance (6%) / Full carbon value / Both, with the % of budget going to `EMERGING_FOCUS`.
   - Compute both after the main result so the main KPIs appear instantly.
9. **Auto-recommendations (Cell 21):** the 5 rule-based sentences, generated with exactly the rules in §5.7, shown as a numbered list in a highlighted box.

Every result block carries the caption *"Live calculation in your browser — same formulas as notebook Cell N"*.

### 3.5 Company Lens (`/company`): Cell 22
- **Inputs:** company name, country (dropdown), sector (dropdown), own emissions (Mt/yr, default 2.0), reduction target % by 2030 (default 30).
- **Outputs:**
  - the national sector context (2025 Mt, 10-yr trend, momentum)
  - the required yearly change for the company
  - the gap vs the national trend
  - the company's own carbon bill under the 3 scenarios
  - its cheapest options (projects of that country-sector sorted by cost per tonne, using the selected scenario)
- Show the outputs as KPI cards and tables only (no charts).
- **Caption:** "Use national data as context; your own emissions come from your own GHG inventory."

### 3.6 Methodology & Sources (`/methodology`)
- A plain-English walk-through of the pipeline with formulas (§5), the assumption tables (countries, scenarios, the 8 projects) and the limitations list (§8).
- The full `DATA_SOURCES` list, plus these links:
  - EDGAR 2026 report: https://edgar.jrc.ec.europa.eu/report_2026
  - World Bank, State & Trends of Carbon Pricing 2026: https://documents1.worldbank.org/curated/en/099051826185087983/pdf/P502283-3ee8b1dc-6f1a-46dd-8141-e6534fd34af9.pdf
  - IEA, GEC Model Documentation 2025: https://iea.blob.core.windows.net/assets/bccc3753-6330-444e-bc62-356f104ed251/GlobalEnergyandClimateModelDocumentation2025.pdf
  - IRENA, Renewable Power Generation Costs in 2024: https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2025/Jul/IRENA_TEC_RPGC_in_2024_Summary_2025.pdf
  - Our World in Data energy dataset: https://github.com/owid/energy-data
  - IPCC AR6 WGIII: https://www.ipcc.ch/report/ar6/wg3/
  - IPCC AR6 Synthesis Report: https://www.ipcc.ch/report/ar6/syr/
  - World Bank API: https://api.worldbank.org/v2/
- Downloads: the dataset CSV, the notebook `.ipynb`, the report `.docx`, `model_assumptions.json`.

### 3.7 Chart Sources (`/chart-sources`)
**MUST:** render `docs/CHART_SOURCES.md` as a styled page. Every chart title on the site links here (a small "ⓘ source" link).

### 3.8 Footer (all pages)
"Applied Python Project · Data: EDGAR_2026_GHG (European Commission JRC), World Bank, IEA, IRENA, IPCC · Illustrative fund — not investment advice". Add a link to the GitHub repo and team names (placeholders: `[Name 1]`, `[Name 2]`).

---

## 4. Code organisation

```
/app                 pages listed above (+ layout with nav/footer)
/components          ChartCard (title + source caption + info link), KpiCards, ControlPanel, charts/*
/lib/model.ts        the model: a port of the notebook functions, same names in camelCase
/lib/format.ts       number formatting (US$ bn, Mt, %)
/lib/worldBank.ts    live API fetch + fallback
/data/*.json         from this workspace (do not edit by hand)
/analysis/*          the notebook + export script (kept for traceability)
/docs/*              CHART_SOURCES.md, report
/public/downloads/*  csv, ipynb, docx
/tests/model.test.ts
```

In `lib/model.ts`, add a comment above every function naming the notebook cell it ports, e.g. `// Port of build_projects() — notebook Cell 17`.

---

## 5. Model specification (port EXACTLY; the notebook code is the reference)

Notation: `B` = budget in US$m, `S` = scenario, the markets are the 33 rows of `model_assumptions.market_inputs`, and the constants come from `model_assumptions.constants`.

### 5.1 Carbon price (`get_carbon_price`, Cell 12)
```
if S == "Current policies":
    return VOLUNTARY_CREDIT_PRICE (5) if sector == "Agriculture" else COUNTRY_INFO[c].price_now
(adv, emg) = SCENARIO_PRICES[S]
price = adv if COUNTRY_INFO[c].group == "Advanced" OR forceAdvanced else emg
if sector == "Agriculture": price *= AGRI_PRICE_SHARE (0.25)
```

### 5.2 Project universe (`project_economics` + `build_projects`, Cell 17)
For each market (country c, sector s) and each intervention with `spec.sector == s` (skip it if `spec.countries` exists and c is not in it):
```
if spec.type == "power":
    mwh_per_kw    = 8.76 * capacity_factor
    tonnes_per_kw = mwh_per_kw * COUNTRY_INFO[c].grid
    capex_per_tpa = capex_per_kw / tonnes_per_kw
    benefit_per_t = (mwh_per_kw * POWER_PRICE_USD_MWH − om_share * capex_per_kw) / tonnes_per_kw
else:
    capex_per_tpa = spec.capex_per_tpa ; benefit_per_t = spec.benefit_per_t
rate  = COUNTRY_INFO[c].discount ; if emergingRate != null and c ∈ EMERGING_FOCUS: rate = emergingRate
price = carbonPrice(c, s, S, forceAdvanced = emergingFullPrice && c ∈ EMERGING_FOCUS)
af    = (1 − (1+rate)^(−life)) / rate
max_tpa = reach * Forecast_2030_Mt[c,s] * 1e6
Abatement_cost_per_t = capex_per_tpa / af − benefit_per_t
Tonnes_per_USDm      = 1e6 / capex_per_tpa
NPV_per_USD          = (benefit_per_t + price) * af / capex_per_tpa − 1
Annual_cash_per_USD  = (benefit_per_t + price) / capex_per_tpa
Max_Mt = max_tpa / 1e6 ; Max_invest_USDm = max_tpa * capex_per_tpa / 1e6
Priority_Score = market_inputs[c,s].Priority_Score
```
This gives **80 projects** in the default scenario. Check it against `reference_results.projects_default_scenario`, which lists every column.

### 5.3 Optimizer (`optimise_portfolio`, Cell 18): a linear program
- **Variables:** xᵢ = US$m invested in project i, with 0 ≤ xᵢ ≤ Max_invest_USDm_i.
- **Objective (maximise):**
  - return mode: Σ NPV_per_USD_i · xᵢ
  - impact mode: Σ (Tonnes_per_USDm_i/1e6 · 1000 + 0.001 · Priority_Score_i/100) · xᵢ. The second term is only a tie-breaker.
- **Constraints:**
  - Σ xᵢ ≤ B
  - for each country: Σ ≤ MAX_COUNTRY_SHARE · B
  - for each project type: Σ ≤ MAX_PROJECT_SHARE · B
  - for each sector: Σ ≥ MIN_SECTOR_SHARE · B
  - return mode only: Σ (Tonnes_per_USDm_i/1e6) · xᵢ ≥ target
- **Output:** keep projects with xᵢ > 0.5, rounding xᵢ to 2 decimals.

### 5.4 Fallback (Cell 18)
Try (objective, target). If it is infeasible, solve again with impact mode and target 0, and set the status to "Target infeasible – showing max-impact plan". If that also fails, show an error card asking the user to loosen the limits.

### 5.5 Metrics (`portfolio_metrics`)
- Invested = Σx
- Mt = Σ x·Tonnes_per_USDm/1e6
- NPV_USDm = Σ x·NPV_per_USD
- cash = Σ x·Annual_cash_per_USD
- Lifetime_Mt = Σ x·Tonnes_per_USDm·Life/1e6
- ROI% = 100·NPV/Invested
- Payback = Invested/cash
- Capital_per_t = Invested/Mt
- target_met = Mt ≥ target − 0.01

### 5.6 Stress tests and strategies (Cells 19–20)
- **Equal split:** each market gets B/33. Within a market, each project gets min(market share / number of projects in that market, Max_invest).
- **Biggest emitters first:** sort projects by their market's Emissions_2025_Mt (descending), then by project name (ascending). Then for each project:
  - `room = MAX_COUNTRY_SHARE·B − spent[country]`
  - `amount = max(0, min(Max_invest, money_left, room))`
- **Respects limits:** country ≤ cap+1, project type ≤ cap+1, every sector ≥ min−1.
- **Uplift** = Mt(Optimised – impact) / Mt(Equal split).
- **Carbon-price risk:** keep the plan's (country, sector, project, x), re-value it with each scenario's project economics, and recompute the metrics.
- **Frontier:** budgets 4000…80000 in steps of 4000, impact mode, target 0.
- **Levers:** for (null,false), (0.06,false), (null,true), (0.06,true), build the projects with those overrides and solve with the current objective and target. Report 100 · Σx over countries in EMERGING_FOCUS / Σx. Skip a lever if it is infeasible.

### 5.7 Recommendations (Cell 21): generate these sentences exactly
1. `Commit US$ {Invested/1000:.1f} bn across {#countries} countries and {#project types} project types, led by {top country} (US$ {its total/1000:.1f} bn).`
2. `The single biggest lever is '{project type with most Mt}' ({its Mt:.1f} Mt/yr avoided).`
3. If the target is met: `The {target} Mt/yr target is achievable within budget ({Mt:.1f} Mt/yr).` Otherwise: `Target missed by {shortfall:.1f} Mt/yr: raise the budget, relax the country limit, or lower the target.`
4. Let downside = NPV (US$ bn) under "Current policies".
   - If downside < 0: `The plan only creates value if carbon prices rise: hedge with contracts for difference, offtake agreements or phased investment.`
   - Else if downside < 0.5·NPV(US$ bn): `The plan stays profitable at today's carbon prices but loses most of its upside – stage investments and track carbon-price policy closely.`
   - Otherwise: `The plan is robust: profitable even at today's carbon prices.`
5. If the best lever's share > today's share + 10: `Only {today:.0f}% of the budget reaches India, Indonesia, Brazil and South Africa, although they hold top-priority markets ({top-3 "Priority: large & growing" markets in EMERGING_FOCUS, joined with ", "}). '{best lever}' would raise this to {share:.0f}% – partner with development banks and secure international carbon-credit buyers for these markets.` Otherwise: `Keep a pipeline in priority markets: {…}.`

### 5.8 Company lens (Cell 22)
- required_rate = ((1 − cut/100)^(1/5) − 1)·100
- bill (US$m/yr) = price(c, s, scenario) · own_Mt for each scenario
- options = projects of (c, s) under the selected scenario, sorted by Abatement_cost_per_t

---

## 6. Behaviour and quality requirements
- Number formats: US$ bn with 1 decimal, Mt with 1 decimal, % with 0–1 decimals, thousands separators. Units on every axis.
- Every chart has a title, axis labels with units, a hover tooltip, a source caption and an "ⓘ source" link. No 3D, no clutter.
- **Chart count check:** the whole site has the Part A charts (§3.2) plus exactly five Part B charts (B1–B5). Every other Part B result is a table, KPI card or text.
- Tables: sortable where useful, sticky header, numbers right-aligned, readable on mobile (horizontal scroll inside the table only, never the page).
- Accessibility: colour is never the only cue (add labels or patterns where needed); controls are keyboard-operable; charts have aria-labels.
- Performance: the main plan updates in under 1 s on a laptop. Run the frontier and levers asynchronously after the main result (e.g. a Web Worker or `setTimeout` chunks).
- No tracking, no API keys, no backend.
- Add a page `<title>` and meta description, and a favicon (a simple leaf or chart glyph).

---

## 7. Tests (MUST pass before deploying)
Write `tests/model.test.ts` (vitest) that loads `data/reference_results.json` and checks:
1. `buildProjects(defaultScenario)` returns 80 rows. Every column of `projects_default_scenario` matches within 1e-6 relative.
2. For each of the 7 `cases`, with the same settings:
   - `status` is equal
   - `kpi.Invested_USDm` is within ±1
   - `kpi.Mt_avoided_per_year` is within ±0.05
   - `kpi.NPV_USDm` is within ±0.5%
   - `target_met` is equal
   - `by_sector_usdm` is within ±1% of the budget
3. Default extras:
   - strategy-comparison Mt values within ±0.1
   - frontier Mt within ±0.2
   - lever shares within ±2 points
   - recommendation sentences 2–5 are identical (allowing ±0.1 rounding differences in numbers inside them)
   - company-lens `required_rate_pct` within ±0.01

**Note on ties (important):** several projects have exactly the same NPV per dollar. For example, industrial efficiency in Japan, the United States, Canada and Australia all have the same 5% discount rate and the same carbon price. When projects tie, any split between them is equally optimal, so a different solver may divide that money differently. That can legitimately change `by_country_usdm`, `plan` rows and the lead country in recommendation 1. So:
- do **not** test per-country or per-project amounts for equality
- in recommendation 1, test only the total, the number of project types and the sentence structure
- do test that every country respects its cap

The totals (Mt, NPV, invested, per-sector) must still match.

Add `npm test` to the README. If a test fails, fix the port; do not loosen the tolerances without telling me why.

---

## 8. Limitations to show on the Methodology page
- National sector emissions ≠ company emissions.
- Sample only: 11 countries, 3 sectors.
- Non-power costs and "reach" shares are illustrative planning assumptions, calibrated to IPCC AR6 cost bands.
- Carbon prices are scenario assumptions (IEA 2035 values) held flat over the project life.
- Agricultural credits earn 25% of the price.
- Simplified power economics: US$50/MWh, average grid displacement.
- Linear 2015–2025 trend forecasts.
- A linear optimisation: no fixed costs or minimum ticket sizes.
- Descriptive, not causal.

---

## 9. GitHub repository (MUST)
1. `git init` with a `.gitignore` for Node/Next.js (`node_modules`, `.next`, `.vercel`, `.env*`).
2. Commit in logical steps (scaffold → data → model + tests → history page → markets → simulator → company → methodology/sources → polish).
3. Create a **public** repository named **`carbon-strategy-optimizer`** under my GitHub account (with the GitHub CLI: `gh repo create carbon-strategy-optimizer --public --source . --push`). If `gh` isn't logged in, stop and ask me to run `gh auth login`.
4. Use the provided `README.md`. Fill in the live Vercel URL after deploying, keep the "Chart sources" and "How the data was generated" sections, and add screenshots of each page to `docs/screenshots/`.
5. Add the repo description "Interactive portal: global sectoral GHG emissions (EDGAR 1990–2025) and a US$10bn climate-fund investment optimizer" and the topics `python`, `data-analytics`, `climate`, `optimization`, `nextjs`.

## 10. Deploy on Vercel (MUST)
1. Import the GitHub repo in Vercel (framework: Next.js, default build `next build`, no environment variables), or run `npx vercel --prod` and link it to the repo.
2. After deploying, open every page on the live URL and confirm:
   - the charts render
   - the simulator defaults show 25.0 Mt/yr and about US$16.6 bn NPV
   - the presets work
   - the World Bank badge shows live or stored
   - the downloads work
   - the layout works at phone width
3. Give me the live URL, the GitHub URL and a short summary of anything you couldn't do exactly as specified.

## 11. Acceptance checklist
- [ ] 8 Part A charts match the notebook (Cells 3–10), each with a "Source: Cell N" caption
- [ ] Market Intelligence page (Cells 12–16): **Chart B1 (priority matrix)**; everything else as tables and KPIs; World Bank live/fallback badge
- [ ] Simulator: all 7 controls + presets; KPI cards, **Chart B3 (where the money goes)**, plan table + CSV, **Chart B2 (MACC)**, **Chart B4 (strategy comparison)**, **Chart B5 (carbon-price risk)**, frontier and levers tables, 5 auto-recommendations
- [ ] Part B has **exactly five charts** (B1–B5); every other Part B result is a table, KPI card or text
- [ ] Defaults reproduce the notebook (25.0 Mt/yr, NPV ≈ US$16.6 bn, ROI ≈ 166%, payback ≈ 3.9 yrs)
- [ ] Company lens page
- [ ] Methodology, Sources and Chart Sources pages; caveat visible; downloads work
- [ ] `npm test` passes
- [ ] Public GitHub repo `carbon-strategy-optimizer` with README and screenshots
- [ ] Live on Vercel, responsive, no console errors
