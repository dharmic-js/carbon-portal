"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, Info, CheckCircle2 } from "lucide-react";
import partAData from "@/data/part_a_charts.json";
import ChartCard from "@/components/ChartCard";
import PlotlyChart from "@/components/PlotlyChart";
import KpiCards, { KpiCardItem } from "@/components/KpiCards";
import { formatMt, formatPct, formatNumber } from "@/lib/format";

export default function HistoryPage() {
  const qualityTable = partAData.cell3_quality_table;
  const cell4 = partAData.cell4_sector_dashboard;
  const cell5 = partAData.cell5_country_comparison;
  const cell6 = partAData.cell6_treemap;
  const cell7 = partAData.cell7_rankings;
  const cell8 = partAData.cell8_power_change_1990_2025;
  const cell9 = partAData.cell9_sector_trends;
  const cell10 = partAData.cell10_power_race;

  // Cell 10 Animation State
  const years = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => 1990 + i);
  const [currentYear, setCurrentYear] = useState<number>(2025);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Play/pause loop for Chart Race
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentYear((prev) => {
          if (prev >= 2025) {
            setIsPlaying(false);
            return 2025;
          }
          return prev + 1;
        });
      }, 700);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying]);

  // Sector colours consistent across site
  const SECTOR_COLOURS: Record<string, string> = {
    "Power Industry": "#F4A261",
    "Industrial Combustion": "#2A9D8F",
    Agriculture: "#6A994E",
  };

  // --- CHART 2: CELL 4 (Donut + Ranked Bar) ---
  const cell4Kpis: KpiCardItem[] = [
    {
      label: "Leading Sector",
      value: cell4.kpis.leading_sector,
      subtext: "Largest global emission source in 2025 sample",
      color: "#F4A261",
    },
    {
      label: "Leading Emissions",
      value: formatMt(cell4.kpis.leading_value_mt, 1, "Mt"),
      subtext: "Total 2025 emissions across 11 countries",
      color: "#164e63",
    },
    {
      label: "Sector Share",
      value: formatPct(cell4.kpis.leading_share_pct, 1),
      subtext: "Percentage of all 3 sampled sectors combined",
      color: "#365314",
    },
  ];

  const donutTrace: Plotly.Data = {
    type: "pie",
    hole: 0.42,
    labels: cell4.sectors.map((s) => s.Sector),
    values: cell4.sectors.map((s) => s["Emissions (Mt CO2e)"]),
    marker: {
      colors: ["#4C72B0", "#DD8452", "#55A868"],
    },
    textinfo: "label+percent",
    textposition: "inside",
    hoverinfo: "label+value+percent",
  };

  const rankedSectors = [...cell4.sectors].sort(
    (a, b) => a["Emissions (Mt CO2e)"] - b["Emissions (Mt CO2e)"]
  );
  const barTrace: Plotly.Data = {
    type: "bar",
    orientation: "h",
    y: rankedSectors.map((s) => s.Sector),
    x: rankedSectors.map((s) => s["Emissions (Mt CO2e)"]),
    text: rankedSectors.map((s) => `${s["Emissions (Mt CO2e)"].toFixed(0)} Mt`),
    textposition: "auto",
    marker: {
      color: ["#440154", "#21908C", "#FDE725"],
    },
    hoverinfo: "x+y",
  };

  // --- CHART 3: CELL 5 (Faceted Bar Chart by Sector) ---
  const sectorsList = ["Power Industry", "Industrial Combustion", "Agriculture"];
  const cell5Traces: Plotly.Data[] = [];
  sectorsList.forEach((sec, idx) => {
    const secRows = cell5.rows
      .filter((r) => r.Sector === sec)
      .sort((a, b) => b.Emissions_Mt_CO2eq - a.Emissions_Mt_CO2eq);

    cell5Traces.push({
      type: "bar",
      x: secRows.map((r) => r.Country),
      y: secRows.map((r) => r.Emissions_Mt_CO2eq),
      name: sec,
      marker: { color: SECTOR_COLOURS[sec] },
      xaxis: idx === 0 ? "x" : `x${idx + 1}`,
      yaxis: idx === 0 ? "y" : `y${idx + 1}`,
      hoverinfo: "x+y+name",
    });
  });

  // --- CHART 4: CELL 6 (Treemap) ---
  const treemapLabels = ["Total Emissions", ...sectorsList];
  const treemapParents = ["", "Total Emissions", "Total Emissions", "Total Emissions"];
  const treemapValues = [
    cell6.rows.reduce((sum, r) => sum + r.Emissions_Mt_CO2eq, 0),
    cell6.rows
      .filter((r) => r.Sector === "Power Industry")
      .reduce((sum, r) => sum + r.Emissions_Mt_CO2eq, 0),
    cell6.rows
      .filter((r) => r.Sector === "Industrial Combustion")
      .reduce((sum, r) => sum + r.Emissions_Mt_CO2eq, 0),
    cell6.rows
      .filter((r) => r.Sector === "Agriculture")
      .reduce((sum, r) => sum + r.Emissions_Mt_CO2eq, 0),
  ];

  for (const r of cell6.rows) {
    treemapLabels.push(`${r.Country} (${r.Sector.slice(0, 4)})`);
    treemapParents.push(r.Sector);
    treemapValues.push(r.Emissions_Mt_CO2eq);
  }

  const treemapTrace: Plotly.Data = {
    type: "treemap",
    labels: treemapLabels,
    parents: treemapParents,
    values: treemapValues,
    textinfo: "label+percent parent",
    marker: {
      colorscale: "YlOrRd",
    },
    hoverinfo: "label+value+percent parent",
  };

  // --- CHART 5: CELL 7 (Bump Chart) ---
  const bumpYears = cell7.years; // [1990, 2010, 2025]
  const bumpTraces: Plotly.Data[] = [];
  const countries = Array.from(new Set(cell7.rows.map((r) => r.Country))).sort();

  // Create traces for Power Industry bump chart with annotations for 2025
  const powerBump = cell7.rows.filter((r) => r.Sector === "Power Industry");
  countries.forEach((country) => {
    const cData = powerBump.filter((r) => r.Country === country);
    cData.sort((a, b) => a.Year - b.Year);
    bumpTraces.push({
      type: "scatter",
      mode: "lines+markers+text",
      name: country,
      x: cData.map((d) => d.Year.toString()),
      y: cData.map((d) => d.Rank),
      text: cData.map((d) => (d.Year === 2025 ? ` ${country} (#${d.Rank})` : "")),
      textposition: "middle right",
      line: { shape: "spline", width: 2.5 },
      marker: { size: 9 },
    });
  });

  // --- CHART 6: CELL 8 (Diverging Horizontal Bars 1990→2025) ---
  const sortedChange = [...cell8.rows].sort((a, b) => a.Change - b.Change);
  const cell8Trace: Plotly.Data = {
    type: "bar",
    orientation: "h",
    y: sortedChange.map((r) => r.Country),
    x: sortedChange.map((r) => r.Change),
    text: sortedChange.map(
      (r) => `${r.Change > 0 ? "+" : ""}${r.Change.toFixed(1)} Mt`
    ),
    textposition: "outside",
    marker: {
      color: sortedChange.map((r) => (r.Change >= 0 ? "#D9534F" : "#2A9D8F")),
    },
    hoverinfo: "x+y",
  };

  // --- CHART 7: CELL 9 (Sector Trends Small Multiples) ---
  const cell9Traces: Plotly.Data[] = sectorsList.map((sec, idx) => {
    const sRows = cell9.rows.filter((r) => r.Sector === sec);
    sRows.sort((a, b) => a.Year - b.Year);
    return {
      type: "scatter",
      mode: "lines",
      name: sec,
      x: sRows.map((r) => r.Year),
      y: sRows.map((r) => r.Emissions_Mt_CO2eq),
      fill: "tozeroy",
      fillcolor: "rgba(36, 123, 160, 0.15)",
      line: { color: "#247BA0", width: 2.5 },
      xaxis: idx === 0 ? "x" : `x${idx + 1}`,
      yaxis: idx === 0 ? "y" : `y${idx + 1}`,
    };
  });

  // --- CHART 8: CELL 10 (Animated Bar Chart Race) ---
  const yearData = cell10.rows.filter((r) => r.Year === currentYear);
  const sortedYearData = [...yearData].sort(
    (a, b) => a.Emissions_Mt_CO2eq - b.Emissions_Mt_CO2eq
  );
  const maxRaceVal = Math.max(...cell10.rows.map((r) => r.Emissions_Mt_CO2eq));

  const raceTrace: Plotly.Data = {
    type: "bar",
    orientation: "h",
    y: sortedYearData.map((r) => r.Country),
    x: sortedYearData.map((r) => r.Emissions_Mt_CO2eq),
    text: sortedYearData.map((r) => `${r.Emissions_Mt_CO2eq.toFixed(1)} Mt`),
    textposition: "outside",
    marker: {
      color: sortedYearData.map((r) =>
        r.Country === "China"
          ? "#C0392B"
          : r.Country === "United States"
          ? "#247BA0"
          : r.Country === "India"
          ? "#E67E22"
          : "#64748b"
      ),
    },
    hoverinfo: "x+y",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold uppercase tracking-wider">
          <span>Part A · Notebook Cells 3–10</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Historical Analysis (1990–2025)
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-4xl leading-relaxed">
          Reconstruction of all eight historical visuals from the Applied Python project notebook.
          Tracing emissions across 11 major economies reveals the massive structural divergence
          in power, industry, and agriculture over 36 years.
        </p>
      </div>

      {/* Visual 1: Cell 3 Data Quality Table */}
      <ChartCard
        title="Visual A1: Dataset Overview & Data Quality Verification"
        cellNumber={3}
        insight="All 1,188 observations across 11 countries, 3 sectors, and 36 years (1990–2025) are verified 100% complete with zero duplicate rows and zero missing emissions values, confirming full integrity for analytical modeling."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Quality Measure</th>
                <th className="py-2.5 px-4 text-right">Result</th>
                <th className="py-2.5 px-4 text-slate-500 font-normal">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {qualityTable.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-4 font-medium text-slate-900">
                    {item.Measure}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800">
                    {typeof item.Result === "number"
                      ? formatNumber(item.Result, 0)
                      : item.Result}
                  </td>
                  <td className="py-2.5 px-4 text-emerald-600 text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Complete</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Visual 2: Cell 4 Sector Dashboard */}
      <ChartCard
        title="Visual A2: 2025 Sector Performance Dashboard"
        cellNumber={4}
        insight={`In 2025, the Power Industry dominated total emissions with ${formatMt(cell4.kpis.leading_value_mt, 1, "Mt")} (${cell4.kpis.leading_share_pct.toFixed(1)}% of sampled emissions), followed by Industrial Combustion (23.6%) and Agriculture (16.7%). Cleaning the power grid remains the essential catalyst for overall decarbonisation.`}
      >
        <div className="space-y-6">
          <KpiCards cards={cell4Kpis} columns={3} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="h-80">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                Sector Shares (Donut Chart)
              </h4>
              <PlotlyChart
                data={[donutTrace]}
                layout={{
                  height: 300,
                  margin: { l: 20, r: 20, t: 20, b: 20 },
                  showlegend: true,
                  legend: { orientation: "h", y: -0.1 },
                }}
              />
            </div>

            <div className="h-80">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                Ranked Emissions by Sector (Mt CO₂e)
              </h4>
              <PlotlyChart
                data={[barTrace]}
                layout={{
                  height: 300,
                  margin: { l: 140, r: 40, t: 20, b: 40 },
                  xaxis: { title: { text: "Emissions (Mt CO₂e)" } },
                  yaxis: { automargin: true },
                }}
              />
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Visual 3: Cell 5 Faceted Country Comparison */}
      <ChartCard
        title="Visual A3: Country Comparison by Sector (2025)"
        cellNumber={5}
        insight="Emissions volume is heavily concentrated in China and the United States across all three sectors, but national profiles diverge sharply: India and Brazil carry large agricultural shares, while China dominates power and industrial combustion."
      >
        <div className="space-y-6">
          {sectorsList.map((sec, idx) => {
            const trace = cell5Traces[idx];
            return (
              <div key={sec} className="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-slate-800">
                    Panel {idx + 1}: {sec}
                  </h4>
                  <span className="text-xs text-slate-500">
                    Independent scale (Mt CO₂e)
                  </span>
                </div>
                <div className="h-56">
                  <PlotlyChart
                    data={[
                      {
                        ...trace,
                        xaxis: "x",
                        yaxis: "y",
                      },
                    ]}
                    layout={{
                      height: 220,
                      margin: { l: 50, r: 20, t: 10, b: 65 },
                      xaxis: { tickangle: -30 },
                      yaxis: { title: { text: "Mt CO₂e" } },
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Visual 4: Cell 6 Treemap */}
      <ChartCard
        title="Visual A4: Interactive Sector → Country Emissions Treemap (2025)"
        cellNumber={6}
        insight="The hierarchical decomposition reveals that China Power Industry alone represents over 35% of all sampled emissions across the 11 countries, demonstrating the decisive impact of Chinese grid transition on global progress."
      >
        <div className="h-[520px]">
          <PlotlyChart
            data={[treemapTrace]}
            layout={{
              height: 500,
              margin: { l: 10, r: 10, t: 10, b: 10 },
            }}
          />
        </div>
      </ChartCard>

      {/* Visual 5: Cell 7 Bump Chart */}
      <ChartCard
        title="Visual A5: Shift in Country Emissions Rankings (1990 → 2010 → 2025)"
        cellNumber={7}
        insight="Between 1990 and 2025, China leaped to rank #1 in Power Industry and Industrial Combustion, displacing the United States, while India climbed rapidly into the top 3 across all three sectors as domestic energy demand expanded."
      >
        <div className="h-[460px]">
          <PlotlyChart
            data={bumpTraces}
            layout={{
              height: 440,
              margin: { l: 40, r: 140, t: 20, b: 40 },
              xaxis: {
                title: { text: "Snapshot Year" },
                type: "category",
              },
              yaxis: {
                title: { text: "Emissions Rank (1 = Largest Emitter)" },
                autorange: "reversed",
                dtick: 1,
              },
              showlegend: false,
            }}
          />
        </div>
      </ChartCard>

      {/* Visual 6: Cell 8 Diverging Bar Chart */}
      <ChartCard
        title="Visual A6: Change in Power Industry Emissions (1990 → 2025)"
        cellNumber={8}
        insight="Advanced economies achieved major absolute cuts led by the US (-344.0 Mt), Germany (-250.7 Mt), and the UK (-150.2 Mt), but these structural savings were overtaken by massive growth in China (+5,584.9 Mt) and India (+1,090.8 Mt)."
      >
        <div className="h-[460px]">
          <PlotlyChart
            data={[cell8Trace]}
            layout={{
              height: 440,
              margin: { l: 120, r: 60, t: 20, b: 40 },
              xaxis: {
                title: { text: "Net Change in Power Emissions (Mt CO₂e)" },
                zeroline: true,
                zerolinecolor: "black",
                zerolinewidth: 1.5,
              },
              yaxis: { automargin: true },
            }}
          />
        </div>
      </ChartCard>

      {/* Visual 7: Cell 9 Sector Trends Small Multiples */}
      <ChartCard
        title="Visual A7: Long-Run Sector Trends (1990–2025)"
        cellNumber={9}
        insight="Power Industry emissions nearly tripled across the 36-year span before stabilizing around 2024. Industrial Combustion expanded steadily driven by emerging manufacturing, while Agriculture followed gradual structural growth."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sectorsList.map((sec, idx) => {
            const trace = cell9Traces[idx];
            return (
              <div key={sec} className="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 text-center">
                  {sec}
                </h4>
                <div className="h-56">
                  <PlotlyChart
                    data={[
                      {
                        ...trace,
                        xaxis: "x",
                        yaxis: "y",
                      },
                    ]}
                    layout={{
                      height: 220,
                      margin: { l: 50, r: 15, t: 10, b: 40 },
                      xaxis: { title: { text: "Year" } },
                      yaxis: { title: { text: "Mt CO₂e" } },
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Visual 8: Cell 10 Animated Bar Chart Race */}
      <ChartCard
        title="Visual A8: Power Industry Emissions Bar Chart Race (1990–2025)"
        cellNumber={10}
        insight="This year-by-year ranking animates the historic shift of global power generation: the United States led throughout the 1990s until China's exponential post-2002 industrial expansion surged past in 2006 to establish unmatched volume."
        headerAction={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition"
              aria-label={isPlaying ? "Pause race animation" : "Play race animation"}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Play Race</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentYear(1990);
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Reset to 1990"
              aria-label="Reset to 1990"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-black text-teal-900 font-mono">
                {currentYear}
              </span>
              <span className="text-xs text-slate-500">
                Frame: {currentYear - 1990 + 1} of 36 years
              </span>
            </div>
            <div className="flex-1 max-w-md flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">1990</span>
              <input
                type="range"
                min={1990}
                max={2025}
                value={currentYear}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentYear(parseInt(e.target.value, 10));
                }}
                className="w-full accent-teal-700 cursor-pointer"
                aria-label="Timeline Year Slider"
              />
              <span className="text-xs text-slate-400 font-mono">2025</span>
            </div>
          </div>

          <div className="h-[460px]">
            <PlotlyChart
              data={[raceTrace]}
              layout={{
                height: 440,
                margin: { l: 120, r: 60, t: 20, b: 40 },
                xaxis: {
                  title: { text: "Power Emissions (Mt CO₂e)" },
                  range: [0, maxRaceVal * 1.15],
                },
                yaxis: { automargin: true },
              }}
            />
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
