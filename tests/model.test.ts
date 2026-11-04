import { describe, it, expect } from "vitest";
import referenceData from "../data/reference_results.json";
import {
  buildProjects,
  optimisePortfolio,
  compareStrategies,
  computeRobustness,
  computeFrontier,
  computeLevers,
  generateRecommendations,
  computeCompanyLens,
  respectsLimits,
} from "../lib/model";

describe("Model Specification Tests", () => {
  it("buildProjects('Announced pledges (IEA APS)') matches reference_results.json", () => {
    const defaultProjects = buildProjects("Announced pledges (IEA APS)");
    expect(defaultProjects).toHaveLength(80);

    const refProjects = referenceData.projects_default_scenario;
    expect(refProjects).toHaveLength(80);

    for (let i = 0; i < 80; i++) {
      const p = defaultProjects[i];
      const r = refProjects[i];

      expect(p.Country).toBe(r.Country);
      expect(p.Sector).toBe(r.Sector);
      expect(p.Project).toBe(r.Project);
      expect(p.Life).toBe(r.Life);

      for (const key of Object.keys(r) as (keyof typeof r)[]) {
        if (typeof r[key] === "number") {
          const valP = p[key as keyof typeof p] as number;
          const valR = r[key] as number;
          const relDiff = Math.abs(valP - valR) / (Math.abs(valR) || 1);
          expect(relDiff, `${key} at ${p.Country} ${p.Project}`).toBeLessThan(1e-4);
        }
      }
    }
  });

  describe("Reference Cases (7 cases)", () => {
    for (const testCase of referenceData.cases) {
      it(`passes case: ${testCase.name}`, async () => {
        const sett = testCase.settings;
        const projects = buildProjects(sett.SCENARIO);

        const res = await optimisePortfolio(
          projects,
          sett.BUDGET_USD_M,
          sett.OBJECTIVE,
          sett.TARGET_MT_PER_YEAR,
          sett.MAX_COUNTRY_SHARE,
          sett.MIN_SECTOR_SHARE,
          sett.MAX_PROJECT_SHARE
        );

        // Status is equal
        expect(res.status).toBe(testCase.status);

        // Invested within +-1
        expect(Math.abs(res.kpi.Invested_USDm - testCase.kpi.Invested_USDm)).toBeLessThan(1.0);

        // Mt avoided within +-0.05
        expect(Math.abs(res.kpi.Mt_avoided_per_year - testCase.kpi.Mt_avoided_per_year)).toBeLessThan(0.05);

        // NPV within +-0.5%
        const npvDiffPct =
          Math.abs(res.kpi.NPV_USDm - testCase.kpi.NPV_USDm) / Math.abs(testCase.kpi.NPV_USDm);
        expect(npvDiffPct).toBeLessThan(0.005);

        // Target met is equal
        expect(res.target_met).toBe(testCase.target_met);

        // by_sector_usdm is within +-1% of the budget
        const budget = sett.BUDGET_USD_M;
        const allowedSectorDiff = 0.01 * budget;
        for (const [sec, expectedVal] of Object.entries(testCase.by_sector_usdm)) {
          const actualVal = res.by_sector_usdm[sec] || 0;
          expect(
            Math.abs(actualVal - expectedVal),
            `Sector ${sec} mismatch in ${testCase.name}`
          ).toBeLessThanOrEqual(allowedSectorDiff);
        }

        // Test that every country respects its cap
        for (const [c, amount] of Object.entries(res.by_country_usdm)) {
          expect(amount).toBeLessThanOrEqual(sett.MAX_COUNTRY_SHARE * budget + 1);
        }
      }, 30000);
    }
  });

  describe("Default Extras Tests", () => {
    it("matches strategy comparison", async () => {
      const defaultProjects = buildProjects("Announced pledges (IEA APS)");
      const strats = await compareStrategies(defaultProjects, 10000, 25, 0.3, 0.2, 0.3);
      const refStrats = referenceData.default_extras.strategy_comparison;

      for (let i = 0; i < strats.length; i++) {
        const s = strats[i];
        const r = refStrats[i];
        expect(s.Strategy).toBe(r.Strategy);
        expect(Math.abs(s.Mt_avoided_per_year - r.Mt_avoided_per_year)).toBeLessThan(0.1);
        expect(s.Within_risk_limits).toBe(r.Within_risk_limits);
      }
    }, 30000);

    it("matches frontier Mt within 0.2", async () => {
      const defaultProjects = buildProjects("Announced pledges (IEA APS)");
      const frontier = await computeFrontier(defaultProjects, 0.3, 0.2, 0.3);
      const refFrontier = referenceData.default_extras.frontier;

      expect(frontier).toHaveLength(refFrontier.length);
      for (let i = 0; i < frontier.length; i++) {
        expect(Math.abs(frontier[i].Mt - refFrontier[i].Mt)).toBeLessThan(0.2);
      }
    }, 30000);

    it("matches lever shares within 2 points", async () => {
      const levers = await computeLevers(
        "Announced pledges (IEA APS)",
        10000,
        "Maximise financial return (NPV)",
        25,
        0.3,
        0.2,
        0.3
      );
      const refLevers = referenceData.default_extras.levers;

      expect(levers).toHaveLength(refLevers.length);
      for (let i = 0; i < levers.length; i++) {
        expect(levers[i].Lever).toBe(refLevers[i].Lever);
        expect(Math.abs(levers[i].Share_to_EMDE_pct - refLevers[i].Share_to_EMDE_pct)).toBeLessThan(2.0);
      }
    }, 30000);

    it("matches recommendation sentences", async () => {
      const defaultProjects = buildProjects("Announced pledges (IEA APS)");
      const optRes = await optimisePortfolio(defaultProjects, 10000, "Maximise financial return (NPV)", 25, 0.3, 0.2, 0.3);
      const robustness = computeRobustness(optRes.plan);
      const levers = await computeLevers(
        "Announced pledges (IEA APS)",
        10000,
        "Maximise financial return (NPV)",
        25,
        0.3,
        0.2,
        0.3
      );

      const recs = generateRecommendations(optRes, robustness, levers, 25);
      const refRecs = referenceData.default_extras.recommendations;

      expect(recs).toHaveLength(5);
      // Rec 1 check structure
      expect(recs[0]).toMatch(/^Commit US\$ 10\.0 bn across \d+ countries and \d+ project types, led by /);

      // Recs 2 to 5 check
      for (let i = 1; i < 5; i++) {
        // Allow minor rounding difference in numbers
        const cleanRec = recs[i].replace(/\d+\.\d+/g, (m) => parseFloat(m).toFixed(0));
        const cleanRef = refRecs[i].replace(/\d+\.\d+/g, (m) => parseFloat(m).toFixed(0));
        expect(cleanRec).toBe(cleanRef);
      }
    }, 30000);

    it("matches company-lens required_rate_pct within 0.01", () => {
      const lens = computeCompanyLens(
        "Illustrative manufacturer",
        "India",
        "Industrial Combustion",
        2.0,
        30
      );
      const refLens = referenceData.default_extras.company_lens_default;
      expect(Math.abs(lens.required_rate_pct - refLens.required_rate_pct)).toBeLessThan(0.01);
    });
  });
});
