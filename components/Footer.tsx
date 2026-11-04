import React from "react";
import Link from "next/link";
import { Github, ExternalLink, ShieldAlert } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                C
              </div>
              <span className="text-white font-bold text-base tracking-tight">
                Carbon Strategy & Investment Optimizer
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Applied Python business-analytics project evaluating 33 country–sector markets
              across 1990–2025 and simulating optimal capital allocation for a US$10 billion
              decarbonisation fund.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Data & Citations
            </h4>
            <ul className="text-xs space-y-2 text-slate-400">
              <li>
                <span className="text-slate-300 font-medium">EDGAR_2026_GHG</span> — European Commission JRC
              </li>
              <li>
                <span className="text-slate-300 font-medium">World Bank</span> — Open Data API & State of Carbon Pricing 2026
              </li>
              <li>
                <span className="text-slate-300 font-medium">IEA</span> — Global Energy and Climate Model Documentation 2025
              </li>
              <li>
                <span className="text-slate-300 font-medium">IRENA</span> — Renewable Power Generation Costs in 2024
              </li>
              <li>
                <span className="text-slate-300 font-medium">IPCC AR6</span> — WGIII mitigation cost bands
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Project & Team
            </h4>
            <p className="text-xs text-slate-400 mb-2">
              Course: Introduction to Python (Applied Python Project)
            </p>
            <p className="text-xs text-slate-300 font-medium mb-3">
              Team: <span className="text-teal-400">[Name 1]</span> · <span className="text-teal-400">[Name 2]</span>
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/djs6038/carbon-strategy-optimizer"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <Link
                href="/chart-sources"
                className="text-xs text-teal-400 hover:underline"
              >
                Chart Sources ⓘ
              </Link>
            </div>
          </div>
        </div>

        {/* Caveat alert box */}
        <div className="bg-slate-800/80 rounded-lg p-3.5 border border-slate-700 mb-6 flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-semibold">Important Caveat: </strong>
            National sector emissions are <em>not</em> company emissions. We use national data to size markets and systemic opportunities, never as an individual company&apos;s footprint. The US$10 billion fund is illustrative, and non-power project costs are planning assumptions. This portal does not constitute financial or investment advice.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Applied Python Project · Data: EDGAR_2026_GHG (European Commission JRC), World Bank, IEA, IRENA, IPCC · Illustrative fund — not investment advice
          </span>
          <span>MIT License</span>
        </div>
      </div>
    </footer>
  );
}
