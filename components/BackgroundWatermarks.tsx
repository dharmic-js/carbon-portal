import React from "react";

/**
 * BackgroundWatermarks
 * 
 * Provides subtle, high-fidelity climate-tech and financial analytics watermark imagery
 * across the portal background.
 *
 * Visual elements include:
 * 1. Top-Right: Atmospheric Earth Globe & Planetary Carbon Flow Streamlines (Navy & Teal)
 * 2. Mid-Left: Renewable Clean-Energy Infrastructure (Wind Turbines, Solar PV Arrays, Grid) (Teal & Olive)
 * 3. Bottom-Right: Capital Investment Nodes & Carbon Molecular Geometry (Navy & Cyan)
 * 4. Ambient Topographic Isobar Waves (Meteorological flow lines)
 */
export default function BackgroundWatermarks() {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* =========================================================================
          1. TOP-RIGHT: Atmospheric Earth Globe & Planetary Carbon Flow Streamlines
         ========================================================================= */}
      <svg
        className="absolute -top-16 -right-20 sm:top-2 sm:-right-8 w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] text-teal-900/60 transition-opacity duration-1000"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#172554" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.09" />
            <stop offset="50%" stopColor="#0f766e" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Outer orbital rings */}
        <circle cx="300" cy="300" r="260" stroke="#0f766e" strokeWidth="1" strokeDasharray="6 6" strokeOpacity="0.08" />
        <circle cx="300" cy="300" r="230" stroke="#172554" strokeWidth="1.2" strokeOpacity="0.07" />
        <circle cx="300" cy="300" r="200" fill="url(#globeGrad)" stroke="#0f766e" strokeWidth="1.5" strokeOpacity="0.09" />

        {/* Latitude lines (parallels) */}
        <ellipse cx="300" cy="300" rx="200" ry="40" stroke="#0f766e" strokeWidth="1.2" strokeOpacity="0.08" />
        <ellipse cx="300" cy="230" rx="180" ry="32" stroke="#0f766e" strokeWidth="1" strokeOpacity="0.06" />
        <ellipse cx="300" cy="370" rx="180" ry="32" stroke="#0f766e" strokeWidth="1" strokeOpacity="0.06" />
        <ellipse cx="300" cy="170" rx="140" ry="24" stroke="#172554" strokeWidth="0.9" strokeOpacity="0.05" />
        <ellipse cx="300" cy="430" rx="140" ry="24" stroke="#172554" strokeWidth="0.9" strokeOpacity="0.05" />

        {/* Longitude lines (meridians) */}
        <ellipse cx="300" cy="300" rx="40" ry="200" stroke="#0f766e" strokeWidth="1.2" strokeOpacity="0.08" />
        <ellipse cx="300" cy="300" rx="100" ry="200" stroke="#0f766e" strokeWidth="1" strokeOpacity="0.06" />
        <ellipse cx="300" cy="300" rx="160" ry="200" stroke="#172554" strokeWidth="0.9" strokeOpacity="0.05" />
        <line x1="300" y1="100" x2="300" y2="500" stroke="#0f766e" strokeWidth="1.2" strokeOpacity="0.09" strokeDasharray="4 4" />
        <line x1="100" y1="300" x2="500" y2="300" stroke="#0f766e" strokeWidth="1.2" strokeOpacity="0.09" />

        {/* Planetary Carbon Flow Streamlines & Trade Winds */}
        <path
          d="M 60 220 C 180 180, 260 240, 380 200 C 450 180, 520 220, 570 200"
          stroke="url(#streamGrad)"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M 40 280 C 140 250, 240 320, 360 270 C 440 240, 500 290, 590 260"
          stroke="url(#streamGrad)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 70 350 C 190 320, 270 380, 390 340 C 460 320, 510 360, 580 340"
          stroke="url(#streamGrad)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 120 420 C 220 390, 300 450, 420 410 C 480 390, 530 430, 580 410"
          stroke="url(#streamGrad)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Orbiting Satellite Data Nodes */}
        <circle cx="160" cy="180" r="4" fill="#0f766e" fillOpacity="0.12" />
        <circle cx="440" cy="220" r="3.5" fill="#14b8a6" fillOpacity="0.12" />
        <circle cx="360" cy="380" r="4.5" fill="#172554" fillOpacity="0.1" />
        <circle cx="210" cy="410" r="3" fill="#047857" fillOpacity="0.1" />
        <line x1="160" y1="180" x2="220" y2="210" stroke="#0f766e" strokeWidth="0.8" strokeDasharray="3 3" strokeOpacity="0.08" />
        <line x1="360" y1="380" x2="440" y2="350" stroke="#172554" strokeWidth="0.8" strokeDasharray="3 3" strokeOpacity="0.08" />
      </svg>

      {/* =========================================================================
          2. MID-LEFT: Renewable Energy Infrastructure (Wind Turbines & Solar PV)
         ========================================================================= */}
      <svg
        className="absolute top-[34%] -left-16 sm:top-[30%] sm:left-2 w-[340px] h-[480px] sm:w-[460px] sm:h-[600px] text-teal-800/50"
        viewBox="0 0 500 650"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="renewGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#166534" stopOpacity="0.07" />
            <stop offset="50%" stopColor="#0f766e" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Ground Terrain Horizon Silhouette */}
        <path
          d="M 0 580 C 120 560, 240 595, 360 570 C 420 560, 470 575, 500 565 L 500 650 L 0 650 Z"
          fill="url(#renewGrad)"
        />

        {/* --- WIND TURBINE 1 (Primary, Large) --- */}
        {/* Tower */}
        <polygon points="186,575 194,575 191,220 189,220" fill="#0f766e" fillOpacity="0.07" />
        {/* Nacelle hub */}
        <circle cx="190" cy="220" r="5.5" fill="#0f766e" fillOpacity="0.09" stroke="#166534" strokeWidth="1" strokeOpacity="0.08" />
        {/* Blade 1 (Vertical upward) */}
        <path d="M 190 220 C 187 180, 185 130, 190 70 C 193 130, 192 180, 190 220" fill="#0f766e" fillOpacity="0.07" />
        {/* Blade 2 (Down-Right 120 deg) */}
        <path d="M 190 220 C 220 238, 270 262, 320 295 C 275 270, 228 245, 190 220" fill="#0f766e" fillOpacity="0.07" />
        {/* Blade 3 (Down-Left 120 deg) */}
        <path d="M 190 220 C 160 240, 115 268, 60 300 C 105 270, 152 245, 190 220" fill="#0f766e" fillOpacity="0.07" />

        {/* --- WIND TURBINE 2 (Secondary, Background/Mid-distance) --- */}
        {/* Tower */}
        <polygon points="318,570 323,570 321,330 319,330" fill="#166534" fillOpacity="0.05" />
        {/* Nacelle hub */}
        <circle cx="320" cy="330" r="4" fill="#166534" fillOpacity="0.08" />
        {/* Blade 1 (Tilted 30 deg) */}
        <path d="M 320 330 C 330 295, 345 255, 360 220 C 350 258, 335 298, 320 330" fill="#166534" fillOpacity="0.05" />
        {/* Blade 2 */}
        <path d="M 320 330 C 322 365, 318 410, 305 445 C 310 408, 316 365, 320 330" fill="#166534" fillOpacity="0.05" />
        {/* Blade 3 */}
        <path d="M 320 330 C 290 325, 255 315, 215 305 C 255 318, 290 325, 320 330" fill="#166534" fillOpacity="0.05" />

        {/* --- SOLAR PV ARRAYS (Foreground clean power farm) --- */}
        {/* Panel Array 1 */}
        <polygon points="80,590 150,565 210,572 135,600" fill="#0f766e" fillOpacity="0.06" stroke="#0f766e" strokeWidth="1" strokeOpacity="0.08" />
        <line x1="115" y1="578" x2="173" y2="586" stroke="#0f766e" strokeWidth="0.8" strokeOpacity="0.06" />
        <line x1="105" y1="588" x2="175" y2="570" stroke="#0f766e" strokeWidth="0.8" strokeOpacity="0.06" />

        {/* Panel Array 2 */}
        <polygon points="160,598 230,574 290,580 215,607" fill="#0f766e" fillOpacity="0.06" stroke="#0f766e" strokeWidth="1" strokeOpacity="0.08" />
        <line x1="195" y1="586" x2="253" y2="594" stroke="#0f766e" strokeWidth="0.8" strokeOpacity="0.06" />
        <line x1="185" y1="596" x2="255" y2="578" stroke="#0f766e" strokeWidth="0.8" strokeOpacity="0.06" />

        {/* Panel Array 3 */}
        <polygon points="240,605 310,582 370,588 295,614" fill="#166534" fillOpacity="0.05" stroke="#166534" strokeWidth="1" strokeOpacity="0.07" />

        {/* Sun Angle Vector / Solar Radiation Rays */}
        <line x1="80" y1="120" x2="180" y2="200" stroke="#0f766e" strokeWidth="0.8" strokeDasharray="4 4" strokeOpacity="0.06" />
        <line x1="60" y1="150" x2="140" y2="220" stroke="#0f766e" strokeWidth="0.8" strokeDasharray="4 4" strokeOpacity="0.05" />
      </svg>

      {/* =========================================================================
          3. BOTTOM-RIGHT: Climate Investment Network & Carbon Molecular Clusters
         ========================================================================= */}
      <svg
        className="absolute bottom-6 -right-16 sm:bottom-12 sm:right-4 w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] text-blue-950/50"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="netGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Hexagonal Carbon Molecular Ring (C6 lattice) */}
        <polygon
          points="250,120 310,155 310,225 250,260 190,225 190,155"
          stroke="#0f766e"
          strokeWidth="1.5"
          strokeOpacity="0.08"
          fill="none"
        />
        {/* Double bonds */}
        <line x1="200" y1="165" x2="200" y2="215" stroke="#0f766e" strokeWidth="1" strokeOpacity="0.07" />
        <line x1="250" y1="248" x2="300" y2="218" stroke="#0f766e" strokeWidth="1" strokeOpacity="0.07" />
        <line x1="300" y1="162" x2="250" y2="132" stroke="#0f766e" strokeWidth="1" strokeOpacity="0.07" />

        {/* Linked Secondary Hexagon */}
        <polygon
          points="310,225 370,260 370,330 310,365 250,330 250,260"
          stroke="#172554"
          strokeWidth="1.2"
          strokeOpacity="0.06"
          fill="none"
        />

        {/* Financial Portfolio Capital Frontier Flow Lines */}
        <path
          d="M 50 380 Q 180 370, 240 280 T 450 160"
          stroke="#0f766e"
          strokeWidth="1.5"
          strokeOpacity="0.07"
          fill="none"
        />
        <path
          d="M 70 420 Q 200 410, 280 320 T 470 210"
          stroke="#1e3a8a"
          strokeWidth="1.2"
          strokeOpacity="0.06"
          strokeDasharray="5 5"
          fill="none"
        />

        {/* Investment Asset Allocation Graph Nodes */}
        <circle cx="190" cy="155" r="5" fill="#0f766e" fillOpacity="0.1" />
        <circle cx="250" cy="120" r="5.5" fill="#14b8a6" fillOpacity="0.1" />
        <circle cx="310" cy="155" r="5" fill="#0f766e" fillOpacity="0.1" />
        <circle cx="310" cy="225" r="6" fill="#172554" fillOpacity="0.1" />
        <circle cx="250" cy="260" r="5" fill="#0f766e" fillOpacity="0.1" />
        <circle cx="190" cy="225" r="5" fill="#166534" fillOpacity="0.09" />
        <circle cx="370" cy="260" r="4.5" fill="#1e3a8a" fillOpacity="0.08" />
        <circle cx="370" cy="330" r="5" fill="#0f766e" fillOpacity="0.08" />
        <circle cx="310" cy="365" r="4.5" fill="#172554" fillOpacity="0.08" />
        <circle cx="250" cy="330" r="4" fill="#0f766e" fillOpacity="0.08" />

        {/* Data transmission connections */}
        <line x1="250" y1="120" x2="380" y2="80" stroke="#14b8a6" strokeWidth="0.8" strokeDasharray="3 3" strokeOpacity="0.07" />
        <circle cx="380" cy="80" r="3.5" fill="#14b8a6" fillOpacity="0.09" />
        <line x1="190" y1="225" x2="110" y2="280" stroke="#166534" strokeWidth="0.8" strokeDasharray="3 3" strokeOpacity="0.07" />
        <circle cx="110" cy="280" r="3.5" fill="#166534" fillOpacity="0.09" />
        <line x1="310" y1="365" x2="390" y2="420" stroke="#172554" strokeWidth="0.8" strokeDasharray="3 3" strokeOpacity="0.06" />
        <circle cx="390" cy="420" r="3.5" fill="#172554" fillOpacity="0.08" />
      </svg>

      {/* =========================================================================
          4. METEOROLOGICAL / TOPOGRAPHIC WAVE CONTOURS (Gentle horizontal flow)
         ========================================================================= */}
      <svg
        className="absolute top-[65%] left-0 w-full h-48 text-teal-900/30"
        viewBox="0 0 1440 200"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 0 100 C 320 40, 640 160, 960 70 C 1200 20, 1340 120, 1440 80"
          stroke="#0f766e"
          strokeWidth="1.2"
          strokeOpacity="0.04"
          fill="none"
        />
        <path
          d="M 0 140 C 280 80, 580 180, 880 110 C 1140 60, 1320 150, 1440 120"
          stroke="#172554"
          strokeWidth="1"
          strokeOpacity="0.035"
          fill="none"
        />
      </svg>
    </div>
  );
}
