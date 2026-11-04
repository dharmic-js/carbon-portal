const fs = require('fs');
const solver = require('javascript-lp-solver');

const assumptions = JSON.parse(fs.readFileSync('data/model_assumptions.json', 'utf8'));
const reference = JSON.parse(fs.readFileSync('data/reference_results.json', 'utf8'));

const { COUNTRY_INFO, SCENARIO_PRICES, INTERVENTIONS, constants, market_inputs } = assumptions;
const { VOLUNTARY_CREDIT_PRICE, AGRI_PRICE_SHARE, POWER_PRICE_USD_MWH, EMERGING_FOCUS } = constants;

function getCarbonPrice(country, sector, scenario, forceAdvanced = false) {
  if (scenario === "Current policies") {
    return sector === "Agriculture" ? VOLUNTARY_CREDIT_PRICE : COUNTRY_INFO[country].price_now;
  }
  const prices = SCENARIO_PRICES[scenario];
  const adv = prices.Advanced;
  const emg = prices.Emerging;
  let price = (COUNTRY_INFO[country].group === "Advanced" || forceAdvanced) ? adv : emg;
  if (sector === "Agriculture") {
    price *= AGRI_PRICE_SHARE;
  }
  return price;
}

function projectEconomics(spec, country) {
  if (spec.type === "power") {
    const mwhPerKw = 8.76 * spec.capacity_factor;
    const tonnesPerKw = mwhPerKw * COUNTRY_INFO[country].grid;
    const capexPerTpa = spec.capex_per_kw / tonnesPerKw;
    const cashPerKw = mwhPerKw * POWER_PRICE_USD_MWH - spec.om_share * spec.capex_per_kw;
    const benefitPerT = cashPerKw / tonnesPerKw;
    return { capexPerTpa, benefitPerT };
  } else {
    return { capexPerTpa: spec.capex_per_tpa, benefitPerT: spec.benefit_per_t };
  }
}

function annuityFactor(rate, years) {
  return (1 - Math.pow(1 + rate, -years)) / rate;
}

function buildProjects(scenario, emergingRate = null, emergingFullPrice = false) {
  const sortedMarkets = [...market_inputs].sort((a, b) => {
    if (a.Country !== b.Country) return a.Country.localeCompare(b.Country);
    return a.Sector.localeCompare(b.Sector);
  });

  const rows = [];
  for (const m of sortedMarkets) {
    const country = m.Country;
    const sector = m.Sector;
    const forecast2030 = m.Forecast_2030_Mt;
    const priorityScore = m.Priority_Score;

    for (const [name, spec] of Object.entries(INTERVENTIONS)) {
      if (spec.sector !== sector) continue;
      if (spec.countries && !spec.countries.includes(country)) continue;

      const { capexPerTpa, benefitPerT } = projectEconomics(spec, country);

      let rate = COUNTRY_INFO[country].discount;
      if (emergingRate !== null && EMERGING_FOCUS.includes(country)) {
        rate = emergingRate;
      }
      const forceAdvanced = emergingFullPrice && EMERGING_FOCUS.includes(country);
      const price = getCarbonPrice(country, sector, scenario, forceAdvanced);

      const af = annuityFactor(rate, spec.life);
      const maxTpa = spec.reach * forecast2030 * 1e6;

      const abatementCostPerT = capexPerTpa / af - benefitPerT;
      const tonnesPerUSDm = 1e6 / capexPerTpa;
      const npvPerUSD = (benefitPerT + price) * af / capexPerTpa - 1;
      const annualCashPerUSD = (benefitPerT + price) / capexPerTpa;
      const maxMt = maxTpa / 1e6;
      const maxInvestUSDm = maxTpa * capexPerTpa / 1e6;

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

// Compare projects against reference
const defaultProjects = buildProjects("Announced pledges (IEA APS)");
console.log("Built projects count:", defaultProjects.length);
const refProjs = reference.projects_default_scenario;
let maxDiff = 0;
let maxDiffCol = '';
for (let i = 0; i < defaultProjects.length; i++) {
  const p = defaultProjects[i];
  const r = refProjs[i];
  for (const k of Object.keys(r)) {
    if (typeof r[k] === 'number') {
      const diff = Math.abs(p[k] - r[k]) / (Math.abs(r[k]) || 1);
      if (diff > maxDiff) {
        maxDiff = diff;
        maxDiffCol = `${k} at ${p.Country} ${p.Project}`;
      }
    }
  }
}
console.log("Max relative diff in projects:", maxDiff, "at", maxDiffCol);

function portfolioMetrics(plan) {
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
    ROI_pct: (100 * totalNpv) / totalInvest,
    Payback_years: totalInvest / totalCash,
    Capital_per_t_per_year: totalInvest / totalMt,
  };
}

function solvePortfolio(projects, budget, objective, targetMt, maxCountryShare = 0.3, minSectorShare = 0.2, maxProjectShare = 0.3) {
  const model = {
    optimize: "objective",
    opType: "max",
    constraints: {
      totalBudget: { max: budget }
    },
    variables: {}
  };

  const countries = [...new Set(projects.map(p => p.Country))];
  const sectors = [...new Set(projects.map(p => p.Sector))];
  const projectTypes = [...new Set(projects.map(p => p.Project))];

  for (const c of countries) {
    model.constraints[`country_${c}`] = { max: maxCountryShare * budget };
  }
  for (const pt of projectTypes) {
    model.constraints[`project_${pt}`] = { max: maxProjectShare * budget };
  }
  for (const s of sectors) {
    model.constraints[`sector_${s}`] = { min: minSectorShare * budget };
  }

  const isReturn = objective !== "Maximise CO2e avoided";
  if (isReturn && targetMt > 0) {
    model.constraints["targetMt"] = { min: targetMt };
  }

  projects.forEach((p, idx) => {
    const varName = `x_${idx}`;
    const tonnesPerM = p.Tonnes_per_USDm / 1e6;
    const objCoeff = isReturn
      ? p.NPV_per_USD
      : (tonnesPerM * 1000 + 0.001 * (p.Priority_Score / 100));

    model.constraints[`bound_${varName}`] = { max: p.Max_invest_USDm };

    const varObj = {
      objective: objCoeff,
      totalBudget: 1,
      [`country_${p.Country}`]: 1,
      [`project_${p.Project}`]: 1,
      [`sector_${p.Sector}`]: 1,
      [`bound_${varName}`]: 1,
    };
    if (isReturn && targetMt > 0) {
      varObj["targetMt"] = tonnesPerM;
    }
    model.variables[varName] = varObj;
  });

  const res = solver.Solve(model);
  if (!res.feasible) {
    return { feasible: false, plan: null };
  }

  const plan = [];
  projects.forEach((p, idx) => {
    const varName = `x_${idx}`;
    const val = res[varName] || 0;
    const rounded = Math.round(val * 100) / 100;
    if (rounded > 0.5) {
      plan.push({
        ...p,
        Invest_USDm: rounded,
      });
    }
  });

  return { feasible: true, plan };
}

function optimiseWithFallback(projects, budget, objective, targetMt, maxCountryShare, minSectorShare, maxProjectShare) {
  let status = "All constraints satisfied";
  let sol = solvePortfolio(projects, budget, objective, targetMt, maxCountryShare, minSectorShare, maxProjectShare);
  if (!sol.feasible) {
    status = "Target infeasible – showing max-impact plan";
    sol = solvePortfolio(projects, budget, "Maximise CO2e avoided", 0, maxCountryShare, minSectorShare, maxProjectShare);
    if (!sol.feasible) {
      return { status: "Infeasible", plan: [], kpi: null };
    }
  }
  const kpi = portfolioMetrics(sol.plan);
  return { status, plan: sol.plan, kpi };
}

// Test the 7 cases!
console.log("\n--- TESTING 7 CASES ---");
for (const c of reference.cases) {
  const sett = c.settings;
  const projs = buildProjects(sett.SCENARIO);
  const res = optimiseWithFallback(
    projs,
    sett.BUDGET_USD_M,
    sett.OBJECTIVE,
    sett.TARGET_MT_PER_YEAR,
    sett.MAX_COUNTRY_SHARE,
    sett.MIN_SECTOR_SHARE,
    sett.MAX_PROJECT_SHARE
  );

  if (c.name === 'impact_objective') {
    console.log('JS solver impact_objective plan:');
    res.plan.forEach(p => console.log(p.Country, p.Sector, p.Project, p.Invest_USDm));
  }
  console.log(`Case: ${c.name}`);
  console.log(`  Status expected: "${c.status}" got: "${res.status}"`);
  console.log(`  Invested: expected ${c.kpi.Invested_USDm.toFixed(2)}, got ${res.kpi.Invested_USDm.toFixed(2)} (diff: ${(res.kpi.Invested_USDm - c.kpi.Invested_USDm).toFixed(2)})`);
  console.log(`  Mt avoided: expected ${c.kpi.Mt_avoided_per_year.toFixed(2)}, got ${res.kpi.Mt_avoided_per_year.toFixed(2)} (diff: ${(res.kpi.Mt_avoided_per_year - c.kpi.Mt_avoided_per_year).toFixed(4)})`);
  console.log(`  NPV: expected ${c.kpi.NPV_USDm.toFixed(2)}, got ${res.kpi.NPV_USDm.toFixed(2)} (diff %: ${(Math.abs(res.kpi.NPV_USDm - c.kpi.NPV_USDm)/c.kpi.NPV_USDm*100).toFixed(4)}%)`);

  // by sector check
  const bySector = {};
  for (const p of res.plan) {
    bySector[p.Sector] = (bySector[p.Sector] || 0) + p.Invest_USDm;
  }
  console.log(`  By sector:`, bySector);
  console.log(`  Expected by sector:`, c.by_sector_usdm);
}
