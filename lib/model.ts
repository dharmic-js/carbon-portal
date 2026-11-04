/**
 * lib/model.ts
 * ============
 * TypeScript port of the Python analysis notebook (IPP_PROJECT_FINAL_simplified.py).
 * Each function is labelled with the exact notebook cell it ports.
 */

import assumptionsData from "@/data/model_assumptions.json";
import marketsData from "@/data/markets.json";

export interface ProjectSpec {
  sector: string;
  type: string;
  capex_per_kw?: number;
  capacity_factor?: number;
  om_share?: number;
  life: number;
  reach: number;
  capex_per_tpa?: number;
  benefit_per_t?: number;
  countries?: string[];
}

export interface ProjectRow {
  Country: string;
  Sector: string;
  Project: string;
  Priority_Score: number;
  Capex_per_tpa: number;
  Benefit_per_t: number;
  Carbon_price: number;
  Abatement_cost_per_t: number;
  Tonnes_per_USDm: number;
  NPV_per_USD: number;
  Annual_cash_per_USD: number;
  Life: number;
  Max_Mt: number;
  Max_invest_USDm: number;
}

export interface PlanRow extends ProjectRow {
  Invest_USDm: number;
}

export interface PortfolioKpi {
  Invested_USDm: number;
  Mt_avoided_per_year: number;
  Lifetime_Mt_avoided: number;
  NPV_USDm: number;
  ROI_pct: number;
  Payback_years: number;
  Capital_per_t_per_year: number;
}

export interface OptimisationResult {
  status: "All constraints satisfied" | "Target infeasible – showing max-impact plan" | "Infeasible";
  plan: PlanRow[];
  kpi: PortfolioKpi;
  target_met: boolean;
  by_country_usdm: Record<string, number>;
  by_sector_usdm: Record<string, number>;
  by_project_usdm: Record<string, number>;
}

export interface StrategyResult extends PortfolioKpi {
  Strategy: string;
  Within_risk_limits: "Yes" | "No";
}

export interface RobustnessRow {
  Scenario: string;
  NPV_USD_bn: number;
  ROI_pct: number;
  Payback_years: number;
}

export interface FrontierRow {
  Budget_USDm: number;
  Mt: number;
  Capital_per_t: number;
}

export interface LeverRow {
  Lever: string;
  Share_to_EMDE_pct: number;
}

// Singleton HiGHS solver instance
let highsInstancePromise: Promise<any> | null = null;

export async function getHighsSolver() {
  if (!highsInstancePromise) {
    highsInstancePromise = (async () => {
      const loadHighs = (await import("highs")).default;
      if (typeof window !== "undefined") {
        return await loadHighs({
          locateFile: (file: string) => (file.endsWith(".wasm") ? "/highs.wasm" : file),
        });
      } else {
        return await loadHighs();
      }
    })();
  }
  return highsInstancePromise;
}

// Port of cagr() — notebook Cell 12
export function cagr(startValue: number, endValue: number, years: number): number {
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

// Port of annuity_factor() — notebook Cell 12
export function annuityFactor(rate: number, years: number): number {
  return (1 - Math.pow(1 + rate, -years)) / rate;
}

// Port of get_carbon_price() — notebook Cell 12
export function getCarbonPrice(
  country: string,
  sector: string,
  scenario: string,
  forceAdvanced = false
): number {
  const { COUNTRY_INFO, SCENARIO_PRICES, constants } = assumptionsData;
  const { VOLUNTARY_CREDIT_PRICE, AGRI_PRICE_SHARE } = constants;

  if (scenario === "Current policies") {
    return sector === "Agriculture"
      ? VOLUNTARY_CREDIT_PRICE
      : (COUNTRY_INFO as any)[country].price_now;
  }

  const prices = (SCENARIO_PRICES as any)[scenario];
  const adv = prices.Advanced;
  const emg = prices.Emerging;
  let price =
    (COUNTRY_INFO as any)[country].group === "Advanced" || forceAdvanced ? adv : emg;

  if (sector === "Agriculture") {
    price *= AGRI_PRICE_SHARE;
  }
  return price;
}

// Port of project_economics() — notebook Cell 17
export function projectEconomics(
  spec: ProjectSpec,
  country: string
): { capexPerTpa: number; benefitPerT: number } {
  const { COUNTRY_INFO, constants } = assumptionsData;
  const { POWER_PRICE_USD_MWH } = constants;

  if (spec.type === "power") {
    const mwhPerKw = 8.76 * (spec.capacity_factor || 0);
    const tonnesPerKw = mwhPerKw * (COUNTRY_INFO as any)[country].grid;
    const capexPerTpa = (spec.capex_per_kw || 0) / tonnesPerKw;
    const cashPerKw =
      mwhPerKw * POWER_PRICE_USD_MWH - (spec.om_share || 0) * (spec.capex_per_kw || 0);
    const benefitPerT = cashPerKw / tonnesPerKw;
    return { capexPerTpa, benefitPerT };
  } else {
    return {
      capexPerTpa: spec.capex_per_tpa || 0,
      benefitPerT: spec.benefit_per_t || 0,
    };
  }
}

// Port of build_projects() — notebook Cell 17
export function buildProjects(
  scenario: string,
  emergingRate: number | null = null,
  emergingFullPrice = false
): ProjectRow[] {
  const { COUNTRY_INFO, INTERVENTIONS, constants, market_inputs } = assumptionsData;
  const { EMERGING_FOCUS } = constants;

  // The markets in Python Cell 12 were grouped by [Country, Sector] which sorts alphabetically
  const sortedMarkets = [...market_inputs].sort((a, b) => {
    if (a.Country !== b.Country) return a.Country.localeCompare(b.Country);
    return a.Sector.localeCompare(b.Sector);
  });

  const rows: ProjectRow[] = [];
  for (const m of sortedMarkets) {
    const country = m.Country;
    const sector = m.Sector;
    const forecast2030 = m.Forecast_2030_Mt;
    const priorityScore = m.Priority_Score;

    for (const [name, specRaw] of Object.entries(INTERVENTIONS)) {
      const spec = specRaw as ProjectSpec;
      if (spec.sector !== sector) continue;
      if (spec.countries && !spec.countries.includes(country)) continue;

      const { capexPerTpa, benefitPerT } = projectEconomics(spec, country);

      let rate = (COUNTRY_INFO as any)[country].discount;
      if (emergingRate !== null && EMERGING_FOCUS.includes(country)) {
        rate = emergingRate;
      }
      const forceAdvanced = emergingFullPrice && EMERGING_FOCUS.includes(country);
      const price = getCarbonPrice(country, sector, scenario, forceAdvanced);

      const af = annuityFactor(rate, spec.life);
      const maxTpa = spec.reach * forecast2030 * 1e6;

      const abatementCostPerT = capexPerTpa / af - benefitPerT;
      const tonnesPerUSDm = 1e6 / capexPerTpa;
      const npvPerUSD = ((benefitPerT + price) * af) / capexPerTpa - 1;
      const annualCashPerUSD = (benefitPerT + price) / capexPerTpa;
      const maxMt = maxTpa / 1e6;
      const maxInvestUSDm = (maxTpa * capexPerTpa) / 1e6;

      rows.push({
        Country: country,
        Sector: sector,
        Project: name,
        Priority_Score: priorityScore,
        Capex_per_tpa: capexPerTpa,
        Benefit_per_t: benefitPerT,
        Carbon_price: price,
        Abatement_cost_per_t: abatementCostPerT,
        Tonnes_per_USDm: tonnesPerUSDm,
        NPV_per_USD: npvPerUSD,
        Annual_cash_per_USD: annualCashPerUSD,
        Life: spec.life,
        Max_Mt: maxMt,
        Max_invest_USDm: maxInvestUSDm,
      });
    }
  }
  return rows;
}

// Port of portfolio_metrics() — notebook Cell 18
export function portfolioMetrics(plan: PlanRow[]): PortfolioKpi {
  let totalInvest = 0;
  let totalMt = 0;
  let totalNpv = 0;
  let totalCash = 0;
  let totalLifetimeMt = 0;

  for (const p of plan) {
    const x = p.Invest_USDm;
    totalInvest += x;
    totalMt += (x * p.Tonnes_per_USDm) / 1e6;
    totalNpv += x * p.NPV_per_USD;
    totalCash += x * p.Annual_cash_per_USD;
    totalLifetimeMt += (x * p.Tonnes_per_USDm * p.Life) / 1e6;
  }

  return {
    Invested_USDm: totalInvest,
    Mt_avoided_per_year: totalMt,
    Lifetime_Mt_avoided: totalLifetimeMt,
    NPV_USDm: totalNpv,
    ROI_pct: totalInvest > 0 ? (100 * totalNpv) / totalInvest : 0,
    Payback_years: totalCash > 0 ? totalInvest / totalCash : 0,
    Capital_per_t_per_year: totalMt > 0 ? totalInvest / totalMt : 0,
  };
}

// Port of optimise_portfolio() — notebook Cell 18
export async function solveHighs(
  projects: ProjectRow[],
  budget: number,
  objective: string,
  targetMt: number,
  maxCountryShare = 0.3,
  minSectorShare = 0.2,
  maxProjectShare = 0.3
): Promise<{ feasible: boolean; plan: PlanRow[] }> {
  const highs = await getHighsSolver();
  const isReturn = objective !== "Maximise CO2e avoided";

  // Build LP format
  const objTerms: string[] = [];
  projects.forEach((p, i) => {
    const tonnesPerM = p.Tonnes_per_USDm / 1e6;
    const coeff = isReturn
      ? p.NPV_per_USD
      : tonnesPerM * 1000 + 0.001 * (p.Priority_Score / 100);
    objTerms.push(`${coeff >= 0 ? "+" : ""}${coeff.toFixed(8)} x${i}`);
  });

  const lines: string[] = [];
  lines.push("Maximize");
  lines.push(`  obj: ${objTerms.join(" ")}`);
  lines.push("Subject To");

  // Total budget limit
  lines.push(`  c_budget: ${projects.map((_, i) => `+ 1 x${i}`).join(" ")} <= ${budget}`);

  // Max share per country
  const countries = [...new Set(projects.map((p) => p.Country))];
  countries.forEach((c, idx) => {
    const terms: string[] = [];
    projects.forEach((p, i) => {
      if (p.Country === c) terms.push(`+ 1 x${i}`);
    });
    lines.push(`  c_country_${idx}: ${terms.join(" ")} <= ${(maxCountryShare * budget).toFixed(6)}`);
  });

  // Max share per project type
  const projectTypes = [...new Set(projects.map((p) => p.Project))];
  projectTypes.forEach((pt, idx) => {
    const terms: string[] = [];
    projects.forEach((p, i) => {
      if (p.Project === pt) terms.push(`+ 1 x${i}`);
    });
    lines.push(`  c_project_${idx}: ${terms.join(" ")} <= ${(maxProjectShare * budget).toFixed(6)}`);
  });

  // Min share per sector
  const sectors = [...new Set(projects.map((p) => p.Sector))];
  sectors.forEach((s, idx) => {
    const terms: string[] = [];
    projects.forEach((p, i) => {
      if (p.Sector === s) terms.push(`+ 1 x${i}`);
    });
    lines.push(`  c_sector_${idx}: ${terms.join(" ")} >= ${(minSectorShare * budget).toFixed(6)}`);
  });

  // Target constraint in return mode
  if (isReturn && targetMt > 0) {
    const terms: string[] = [];
    projects.forEach((p, i) => {
      const tonnesPerM = p.Tonnes_per_USDm / 1e6;
      terms.push(`+ ${tonnesPerM.toFixed(8)} x${i}`);
    });
    lines.push(`  c_target: ${terms.join(" ")} >= ${targetMt}`);
  }

  // Bounds
  lines.push("Bounds");
  projects.forEach((p, i) => {
    lines.push(`  0 <= x${i} <= ${p.Max_invest_USDm.toFixed(6)}`);
  });

  lines.push("End");

  try {
    const res = highs.solve(lines.join("\n"), { output_flag: false });
    if (res.Status !== "Optimal") {
      return { feasible: false, plan: [] };
    }

    const plan: PlanRow[] = [];
    projects.forEach((p, i) => {
      const col = res.Columns[`x${i}`];
      const val = col ? col.Primal : 0;
      const rounded = Math.round(val * 100) / 100;
      if (rounded > 0.5) {
        plan.push({
          ...p,
          Invest_USDm: rounded,
        });
      }
    });

    return { feasible: true, plan };
  } catch {
    return { feasible: false, plan: [] };
  }
}

// Port of optimise_portfolio() with fallback — notebook Cell 18
export async function optimisePortfolio(
  projects: ProjectRow[],
  budget: number,
  objective: string,
  targetMt: number,
  maxCountryShare = 0.3,
  minSectorShare = 0.2,
  maxProjectShare = 0.3
): Promise<OptimisationResult> {
  let status: "All constraints satisfied" | "Target infeasible – showing max-impact plan" | "Infeasible" =
    "All constraints satisfied";

  let sol = await solveHighs(
    projects,
    budget,
    objective,
    targetMt,
    maxCountryShare,
    minSectorShare,
    maxProjectShare
  );

  if (!sol.feasible) {
    status = "Target infeasible – showing max-impact plan";
    sol = await solveHighs(
      projects,
      budget,
      "Maximise CO2e avoided",
      0,
      maxCountryShare,
      minSectorShare,
      maxProjectShare
    );
    if (!sol.feasible) {
      return {
        status: "Infeasible",
        plan: [],
        kpi: {
          Invested_USDm: 0,
          Mt_avoided_per_year: 0,
          Lifetime_Mt_avoided: 0,
          NPV_USDm: 0,
          ROI_pct: 0,
          Payback_years: 0,
          Capital_per_t_per_year: 0,
        },
        target_met: false,
        by_country_usdm: {},
        by_sector_usdm: {},
        by_project_usdm: {},
      };
    }
  }

  const kpi = portfolioMetrics(sol.plan);
  const targetMet = kpi.Mt_avoided_per_year >= targetMt - 0.01;

  const byCountry: Record<string, number> = {};
  const bySector: Record<string, number> = {};
  const byProject: Record<string, number> = {};

  for (const p of sol.plan) {
    byCountry[p.Country] = (byCountry[p.Country] || 0) + p.Invest_USDm;
    bySector[p.Sector] = (bySector[p.Sector] || 0) + p.Invest_USDm;
    byProject[p.Project] = (byProject[p.Project] || 0) + p.Invest_USDm;
  }

  // Round values to 2 decimals
  for (const k of Object.keys(byCountry)) byCountry[k] = Math.round(byCountry[k] * 100) / 100;
  for (const k of Object.keys(bySector)) bySector[k] = Math.round(bySector[k] * 100) / 100;
  for (const k of Object.keys(byProject)) byProject[k] = Math.round(byProject[k] * 100) / 100;

  return {
    status,
    plan: sol.plan,
    kpi,
    target_met: targetMet,
    by_country_usdm: byCountry,
    by_sector_usdm: bySector,
    by_project_usdm: byProject,
  };
}

// Port of equal_split() — notebook Cell 19
export function equalSplit(projects: ProjectRow[], budget: number): PlanRow[] {
  // 33 markets
  const numMarkets = 33;
  const moneyPerMarket = budget / numMarkets;

  return projects.map((p) => {
    const sameMarket = projects.filter(
      (m) => m.Country === p.Country && m.Sector === p.Sector
    );
    const share = moneyPerMarket / sameMarket.length;
    const amount = Math.min(share, p.Max_invest_USDm);
    return {
      ...p,
      Invest_USDm: amount,
    };
  });
}

// Port of biggest_emitters_first() — notebook Cell 19
export function biggestEmittersFirst(
  projects: ProjectRow[],
  budget: number,
  maxCountryShare = 0.3
): PlanRow[] {
  const { market_inputs } = assumptionsData;
  const sizeMap: Record<string, number> = {};
  for (const m of market_inputs) {
    sizeMap[`${m.Country}|${m.Sector}`] = m.Emissions_2025_Mt;
  }

  const sorted = [...projects].sort((a, b) => {
    const sizeA = sizeMap[`${a.Country}|${a.Sector}`] || 0;
    const sizeB = sizeMap[`${b.Country}|${b.Sector}`] || 0;
    if (sizeA !== sizeB) return sizeB - sizeA; // descending size
    return a.Project.localeCompare(b.Project); // ascending project name
  });

  let moneyLeft = budget;
  const spentByCountry: Record<string, number> = {};
  const amountsMap: Map<ProjectRow, number> = new Map();

  for (const p of sorted) {
    const already = spentByCountry[p.Country] || 0;
    const room = maxCountryShare * budget - already;
    const amount = Math.max(0, Math.min(p.Max_invest_USDm, moneyLeft, room));
    amountsMap.set(p, amount);
    moneyLeft -= amount;
    spentByCountry[p.Country] = already + amount;
  }

  return projects.map((p) => ({
    ...p,
    Invest_USDm: amountsMap.get(p) || 0,
  }));
}

// Port of respects_limits() — notebook Cell 19
export function respectsLimits(
  plan: PlanRow[],
  budget: number,
  maxCountryShare = 0.3,
  maxProjectShare = 0.3,
  minSectorShare = 0.2
): boolean {
  const byCountry: Record<string, number> = {};
  const byProject: Record<string, number> = {};
  const bySector: Record<string, number> = {
    "Power Industry": 0,
    "Industrial Combustion": 0,
    Agriculture: 0,
  };

  for (const p of plan) {
    byCountry[p.Country] = (byCountry[p.Country] || 0) + p.Invest_USDm;
    byProject[p.Project] = (byProject[p.Project] || 0) + p.Invest_USDm;
    bySector[p.Sector] = (bySector[p.Sector] || 0) + p.Invest_USDm;
  }

  for (const country of Object.keys(byCountry)) {
    if (byCountry[country] > maxCountryShare * budget + 1) return false;
  }
  for (const pt of Object.keys(byProject)) {
    if (byProject[pt] > maxProjectShare * budget + 1) return false;
  }
  for (const s of Object.keys(bySector)) {
    if (bySector[s] < minSectorShare * budget - 1) return false;
  }

  return true;
}

// Port of strategy comparison — notebook Cell 19
export async function compareStrategies(
  projects: ProjectRow[],
  budget: number,
  targetMt: number,
  maxCountryShare = 0.3,
  minSectorShare = 0.2,
  maxProjectShare = 0.3
): Promise<StrategyResult[]> {
  const eqPlan = equalSplit(projects, budget);
  const befPlan = biggestEmittersFirst(projects, budget, maxCountryShare);

  const impactSol = await solveHighs(
    projects,
    budget,
    "Maximise CO2e avoided",
    0,
    maxCountryShare,
    minSectorShare,
    maxProjectShare
  );

  let returnSol = await solveHighs(
    projects,
    budget,
    "Maximise financial return (NPV)",
    targetMt,
    maxCountryShare,
    minSectorShare,
    maxProjectShare
  );
  if (!returnSol.feasible) {
    returnSol = await solveHighs(
      projects,
      budget,
      "Maximise financial return (NPV)",
      0,
      maxCountryShare,
      minSectorShare,
      maxProjectShare
    );
  }

  const strats: { name: string; plan: PlanRow[] }[] = [
    { name: "Equal split", plan: eqPlan },
    { name: "Biggest emitters first", plan: befPlan },
    { name: "Optimised – impact", plan: impactSol.plan },
    { name: "Optimised – return", plan: returnSol.plan },
  ];

  return strats.map(({ name, plan }) => {
    const m = portfolioMetrics(plan);
    const within = respectsLimits(
      plan,
      budget,
      maxCountryShare,
      maxProjectShare,
      minSectorShare
    );
    return {
      Strategy: name,
      ...m,
      Within_risk_limits: within ? "Yes" : "No",
    };
  });
}

// Port of carbon-price risk (robustness) — notebook Cell 20
export function computeRobustness(plan: PlanRow[]): RobustnessRow[] {
  const { SCENARIO_PRICES } = assumptionsData;
  const scenarios = Object.keys(SCENARIO_PRICES);

  return scenarios.map((scenario) => {
    const priced = buildProjects(scenario);
    const priceMap = new Map<string, ProjectRow>();
    for (const p of priced) {
      priceMap.set(`${p.Country}|${p.Sector}|${p.Project}`, p);
    }

    const revaluedPlan: PlanRow[] = plan.map((p) => {
      const match = priceMap.get(`${p.Country}|${p.Sector}|${p.Project}`) || p;
      return {
        ...match,
        Invest_USDm: p.Invest_USDm,
      };
    });

    const m = portfolioMetrics(revaluedPlan);
    return {
      Scenario: scenario,
      NPV_USD_bn: m.NPV_USDm / 1000,
      ROI_pct: m.ROI_pct,
      Payback_years: m.Payback_years,
    };
  });
}

// Port of frontier — notebook Cell 20
export async function computeFrontier(
  projects: ProjectRow[],
  maxCountryShare = 0.3,
  minSectorShare = 0.2,
  maxProjectShare = 0.3
): Promise<FrontierRow[]> {
  const rows: FrontierRow[] = [];
  for (let budget = 4000; budget <= 80000; budget += 4000) {
    const sol = await solveHighs(
      projects,
      budget,
      "Maximise CO2e avoided",
      0,
      maxCountryShare,
      minSectorShare,
      maxProjectShare
    );
    const m = portfolioMetrics(sol.plan);
    rows.push({
      Budget_USDm: budget,
      Mt: m.Mt_avoided_per_year,
      Capital_per_t: m.Capital_per_t_per_year,
    });
  }
  return rows;
}

// Port of financing levers — notebook Cell 20
export async function computeLevers(
  scenario: string,
  budget: number,
  objective: string,
  targetMt: number,
  maxCountryShare = 0.3,
  minSectorShare = 0.2,
  maxProjectShare = 0.3
): Promise<LeverRow[]> {
  const { constants } = assumptionsData;
  const { EMERGING_FOCUS } = constants;

  const leverTests: [string, number | null, boolean][] = [
    ["Today's terms", null, false],
    ["Cheaper finance", 0.06, false],
    ["Full carbon value", null, true],
    ["Both levers", 0.06, true],
  ];

  const results: LeverRow[] = [];
  for (const [label, rate, fullPrice] of leverTests) {
    try {
      const testProjects = buildProjects(scenario, rate, fullPrice);
      let sol = await solveHighs(
        testProjects,
        budget,
        objective,
        targetMt,
        maxCountryShare,
        minSectorShare,
        maxProjectShare
      );
      if (!sol.feasible) {
        sol = await solveHighs(
          testProjects,
          budget,
          "Maximise CO2e avoided",
          0,
          maxCountryShare,
          minSectorShare,
          maxProjectShare
        );
      }
      if (sol.feasible) {
        const moneyThere = sol.plan
          .filter((p) => EMERGING_FOCUS.includes(p.Country))
          .reduce((sum, p) => sum + p.Invest_USDm, 0);
        const total = sol.plan.reduce((sum, p) => sum + p.Invest_USDm, 0);
        results.push({
          Lever: label,
          Share_to_EMDE_pct: total > 0 ? (100 * moneyThere) / total : 0,
        });
      }
    } catch {
      // skip if infeasible
    }
  }
  return results;
}

// Port of generate_recommendations() — notebook Cell 21
export function generateRecommendations(
  optResult: OptimisationResult,
  robustness: RobustnessRow[],
  levers: LeverRow[],
  targetMt: number
): string[] {
  const { plan, kpi, target_met } = optResult;
  const { constants } = assumptionsData;
  const { EMERGING_FOCUS } = constants;

  const recs: string[] = [];

  // Rec 1: Commit US$ X bn across N countries and M project types, led by Country (US$ Y bn).
  const countryTotals: Record<string, number> = {};
  for (const p of plan) {
    countryTotals[p.Country] = (countryTotals[p.Country] || 0) + p.Invest_USDm;
  }
  const sortedCountries = Object.entries(countryTotals).sort((a, b) => b[1] - a[1]);
  const leadCountry = sortedCountries.length > 0 ? sortedCountries[0][0] : "—";
  const leadCountryTotal = sortedCountries.length > 0 ? sortedCountries[0][1] : 0;
  const numCountries = new Set(plan.map((p) => p.Country)).size;
  const numProjectTypes = new Set(plan.map((p) => p.Project)).size;

  recs.push(
    `Commit US$ ${(kpi.Invested_USDm / 1000).toFixed(1)} bn across ${numCountries} countries and ${numProjectTypes} project types, led by ${leadCountry} (US$ ${(leadCountryTotal / 1000).toFixed(1)} bn).`
  );

  // Rec 2: The single biggest lever is 'Project' (X.X Mt/yr avoided).
  const projectMtTotals: Record<string, number> = {};
  for (const p of plan) {
    projectMtTotals[p.Project] =
      (projectMtTotals[p.Project] || 0) + (p.Invest_USDm * p.Tonnes_per_USDm) / 1e6;
  }
  const sortedProjects = Object.entries(projectMtTotals).sort((a, b) => b[1] - a[1]);
  const topProject = sortedProjects.length > 0 ? sortedProjects[0][0] : "—";
  const topProjectMt = sortedProjects.length > 0 ? sortedProjects[0][1] : 0;

  recs.push(
    `The single biggest lever is '${topProject}' (${topProjectMt.toFixed(1)} Mt/yr avoided).`
  );

  // Rec 3: Target met or missed
  if (target_met) {
    recs.push(
      `The ${targetMt} Mt/yr target is achievable within budget (${kpi.Mt_avoided_per_year.toFixed(1)} Mt/yr).`
    );
  } else {
    const shortfall = targetMt - kpi.Mt_avoided_per_year;
    recs.push(
      `Target missed by ${shortfall.toFixed(1)} Mt/yr: raise the budget, relax the country limit, or lower the target.`
    );
  }

  // Rec 4: Downside risk under "Current policies"
  const curPolicy = robustness.find((r) => r.Scenario === "Current policies");
  const downside = curPolicy ? curPolicy.NPV_USD_bn : 0;
  const npvBn = kpi.NPV_USDm / 1000;

  if (downside < 0) {
    recs.push(
      "The plan only creates value if carbon prices rise: hedge with contracts for difference, offtake agreements or phased investment."
    );
  } else if (downside < 0.5 * npvBn) {
    recs.push(
      "The plan stays profitable at today's carbon prices but loses most of its upside – stage investments and track carbon-price policy closely."
    );
  } else {
    recs.push("The plan is robust: profitable even at today's carbon prices.");
  }

  // Rec 5: Emerging markets lever
  const priorityMarkets = [
    "India – Power Industry",
    "India – Agriculture",
    "India – Industrial Combustion",
  ];

  const todayLever = levers.find((l) => l.Lever === "Today's terms");
  const shareToday = todayLever ? todayLever.Share_to_EMDE_pct : 0;
  const bestLever = [...levers].sort(
    (a, b) => b.Share_to_EMDE_pct - a.Share_to_EMDE_pct
  )[0];

  if (bestLever && bestLever.Share_to_EMDE_pct > shareToday + 10) {
    recs.push(
      `Only ${shareToday.toFixed(0)}% of the budget reaches India, Indonesia, Brazil and South Africa, although they hold top-priority markets (${priorityMarkets.join(", ")}). '${bestLever.Lever}' would raise this to ${bestLever.Share_to_EMDE_pct.toFixed(0)}% – partner with development banks and secure international carbon-credit buyers for these markets.`
    );
  } else {
    recs.push(`Keep a pipeline in priority markets: ${priorityMarkets.join(", ")}.`);
  }

  return recs;
}

// Port of company lens — notebook Cell 22
export function computeCompanyLens(
  companyName: string,
  country: string,
  sector: string,
  emissionsMt: number,
  cutPct: number,
  scenario = "Announced pledges (IEA APS)"
) {
  const { SCENARIO_PRICES } = assumptionsData;
  const { cell12_market_profiles } = marketsData;

  const market = cell12_market_profiles.find(
    (m) => m.Country === country && m.Sector === sector
  );

  const yearsLeft = 5; // 2030 - 2025
  const requiredRatePct =
    (Math.pow(1 - cutPct / 100, 1 / yearsLeft) - 1) * 100;

  const billRows = Object.keys(SCENARIO_PRICES).map((scen) => {
    const price = getCarbonPrice(country, sector, scen);
    return {
      Scenario: scen,
      "Carbon price (US$/t)": price,
      "Company carbon bill (US$ m/yr)": price * emissionsMt,
    };
  });

  const allProjects = buildProjects(scenario);
  const options = allProjects
    .filter((p) => p.Country === country && p.Sector === sector)
    .sort((a, b) => a.Abatement_cost_per_t - b.Abatement_cost_per_t)
    .map((p) => ({
      Project: p.Project,
      Abatement_cost_per_t: p.Abatement_cost_per_t,
      Capex_per_tpa: p.Capex_per_tpa,
    }));

  return {
    inputs: {
      COMPANY_NAME: companyName,
      COMPANY_COUNTRY: country,
      COMPANY_SECTOR: sector,
      COMPANY_EMISSIONS_MT: emissionsMt,
      COMPANY_CUT_PCT: cutPct,
    },
    required_rate_pct: requiredRatePct,
    national_cagr_pct: market ? market.Growth_10y_pct : 0,
    national_2025_mt: market ? market.Emissions_2025_Mt : 0,
    national_momentum: market ? market.Momentum : "",
    carbon_bill: billRows,
    options,
  };
}
