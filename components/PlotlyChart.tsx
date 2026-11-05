"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { PlotParams } from "react-plotly.js";

const Plot = dynamic<any>(
  async () => {
    const Plotly = await import("plotly.js-dist-min");
    const createPlotlyComponent = (await import("react-plotly.js/factory")).default;
    return createPlotlyComponent(Plotly.default || Plotly);
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-72 flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-sm animate-pulse">
        <svg
          className="w-6 h-6 animate-spin text-teal-600 mb-2"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        <span>Rendering interactive chart...</span>
      </div>
    ),
  }
);

interface PlotlyChartProps extends PlotParams {
  className?: string;
}

export default function PlotlyChart({ className, ...props }: PlotlyChartProps) {
  const mergedLayout = {
    autosize: true,
    font: { family: "Inter, system-ui, sans-serif", color: "#1e293b" },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    margin: { l: 50, r: 30, t: 40, b: 50, ...(props.layout?.margin || {}) },
    hoverlabel: {
      bgcolor: "#0f172a",
      bordercolor: "#334155",
      font: { color: "#ffffff", family: "Inter, system-ui, sans-serif", size: 12 },
      ...(props.layout?.hoverlabel || {}),
    },
    ...props.layout,
  };

  const mergedConfig = {
    responsive: true,
    displayModeBar: "hover",
    displaylogo: false,
    modeBarButtonsToRemove: [
      "lasso2d",
      "select2d",
      "toggleSpikelines",
      "hoverClosestCartesian",
      "hoverCompareCartesian",
    ],
    toImageButtonOptions: {
      format: "png",
      filename: "carbon_chart",
      height: 600,
      width: 1000,
      scale: 2,
    },
    ...props.config,
  };

  return (
    <div className={`w-full overflow-hidden ${className || ""}`}>
      <Plot
        {...props}
        layout={mergedLayout}
        config={mergedConfig}
        useResizeHandler
        style={{ width: "100%", height: "100%", ...(props.style || {}) }}
      />
    </div>
  );
}
