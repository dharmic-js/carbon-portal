# Carbon Strategy & Investment Optimizer

**Interactive portal:** global sectoral greenhouse-gas emissions (EDGAR, 1990–2025) and a US$10 bn climate-fund investment optimizer.

🔗 **Live site:** `https://<your-vercel-url>.vercel.app` *(fill in after deploying)*
📓 **Notebook:** [`analysis/IPP_PROJECT_FINAL_simplified.ipynb`](analysis/IPP_PROJECT_FINAL_simplified.ipynb)
📄 **Report:** [`docs/IPP_Project_Report_Final.docx`](docs/IPP_Project_Report_Final.docx)
🗺️ **Chart sources:** [`docs/CHART_SOURCES.md`](docs/CHART_SOURCES.md)

---

## The business problem

> How have emissions changed across Agriculture, Industrial Combustion and Power Industry in 11 countries from 1990 to 2025, and which sectors and countries should be prioritised for decarbonisation?

- **Part A: historical analysis (notebook Cells 1–10).** Data cleaning and seven charts showing what happened.
- **Part B: business application (notebook Cells 11–23).** An illustrative **climate investment fund with US$10 billion** decides which decarbonisation projects to fund across 33 country–sector markets. A linear-programming optimizer maximises NPV while avoiding at least 25 Mt CO₂e a year. Risk limits apply: max 30% of the budget per country, max 30% per technology, min 20% per sector.

**Default result:** US$10 bn → 25.0 Mt CO₂e avoided per year, NPV ≈ US$16.6 bn (ROI ≈ 166%, payback ≈ 3.9 years) under IEA announced-pledge carbon prices. At today's carbon prices the NPV falls to ≈ US$0.3 bn. Return-seeking capital sends only 13% of the budget to India, Indonesia, Brazil and South Africa. Giving those projects full carbon value raises that share to about 60%.

> ⚠️ National sector emissions are **not** company emissions. We use them to size markets, never as a company's footprint. The fund is illustrative, and the non-power project costs are planning assumptions. This is not investment advice.

## What's on the portal

| Page | Content | Notebook cells |
|---|---|---|
| Home | Problem, key findings, navigation | — |
| Historical Analysis | The eight Part A visuals rebuilt from the notebook's data (quality table + seven charts) | 3–10 |
| Market Intelligence | Priority matrix (graph), market profiles, World Bank intensity (live API), scorecard, 2030 gap, carbon exposure | 12–16 |
| Fund Simulator | Live controls → optimised plan, KPIs, four graphs (cost curve, where the money goes, strategy comparison, carbon-price risk), tables, recommendations | 11, 17–21 |
| Company Lens | How one company should use the national results | 22 |
| Methodology & Sources | Formulas, assumptions, limitations, data sources, downloads | all |
| Chart Sources | Which notebook cell every chart comes from | all |

**Graphs:** all Part A charts are reproduced from the notebook. Part B runs in full and is shown with five graphs (priority matrix, cost curve, where the money goes, strategy comparison, carbon-price risk) plus tables and KPIs.

## How the data was generated

1. `data/EDGAR_sector_emissions_project_dataset.csv`: the raw dataset (EDGAR_2026_GHG, European Commission JRC).
2. `analysis/IPP_PROJECT_FINAL_simplified.ipynb`: the project notebook. Every code line is commented.
3. `analysis/export_portal_data.py` runs the notebook code unchanged and writes:
   - `data/part_a_charts.json`: data behind the Part A charts (Cells 3–10)
   - `data/markets.json`: market profiles, scorecard, outlook, exposure (Cells 12–16)
   - `data/model_assumptions.json`: control-panel defaults and assumptions (Cell 11)
   - `data/reference_results.json`: optimizer results from SciPy, used to test the browser version

```bash
pip install -r analysis/requirements.txt
python analysis/export_portal_data.py
```

The website re-implements the notebook formulas in TypeScript (`lib/model.ts`, each function labelled with its notebook cell). Automated tests check it against `reference_results.json`.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # model tests against the notebook's results
```

## Data sources

- European Commission JRC: EDGAR Community GHG Database (EDGAR_2026_GHG) and *GHG emissions of all world countries – 2026*
- World Bank: *State and Trends of Carbon Pricing 2026*; World Bank Open Data API (population, GDP)
- IEA: *Global Energy and Climate Model Documentation 2025* (scenario carbon prices); Cost of Capital Observatory
- IRENA: *Renewable Power Generation Costs in 2024* (solar and wind costs)
- Ember via Our World in Data: carbon intensity of electricity
- IPCC AR6: Working Group III (abatement cost bands) and Synthesis Report (1.5 °C pathway)

Full list with links: Methodology page and `data/model_assumptions.json → DATA_SOURCES`.

## Team

`[Name 1 – Roll no.]` · `[Name 2 – Roll no.]` · Course: Introduction to Python (Applied Python Project) · Faculty: `[Instructor]`

## Licence

Code: MIT. EDGAR data: CC BY 4.0 (European Commission JRC); other sources as cited.
