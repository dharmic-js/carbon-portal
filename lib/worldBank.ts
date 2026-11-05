// Port of World Bank API fetch & fallback — notebook Cell 13
import marketsData from "@/data/markets.json";

export interface EconomicContextRow {
  Country: string;
  Population: number;
  GDP_USD: number;
  GDP_Year: number;
  Emissions_2025_Mt: number;
  t_per_person: number;
  kg_per_USD_GDP: number;
}

export interface EconomicContextResult {
  source: "Live: World Bank API" | "Stored values (World Bank 2023)";
  isLive: boolean;
  rows: EconomicContextRow[];
}

export const ISO3_TO_COUNTRY: Record<string, string> = {
  AUS: "Australia",
  BRA: "Brazil",
  CAN: "Canada",
  CHN: "China",
  DEU: "Germany",
  IND: "India",
  IDN: "Indonesia",
  JPN: "Japan",
  ZAF: "South Africa",
  GBR: "United Kingdom",
  USA: "United States",
};

export const COUNTRY_TO_ISO3: Record<string, string> = Object.fromEntries(
  Object.entries(ISO3_TO_COUNTRY).map(([iso, country]) => [country, iso])
);

export async function fetchEconomicContext(): Promise<EconomicContextResult> {
  const fallbackRows: EconomicContextRow[] = marketsData.cell13_economic_context.rows;
  const isoCodes = Object.keys(ISO3_TO_COUNTRY).sort();
  const joinedCodes = isoCodes.join(";");

  try {
    const popUrl = `https://api.worldbank.org/v2/country/${joinedCodes}/indicator/SP.POP.TOTL?format=json&mrv=1&per_page=100`;
    const gdpUrl = `https://api.worldbank.org/v2/country/${joinedCodes}/indicator/NY.GDP.MKTP.CD?format=json&mrv=1&per_page=100`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const [popRes, gdpRes] = await Promise.all([
      fetch(popUrl, { signal: controller.signal }),
      fetch(gdpUrl, { signal: controller.signal }),
    ]);

    clearTimeout(timeoutId);

    if (!popRes.ok || !gdpRes.ok) {
      throw new Error("HTTP error from World Bank API");
    }

    const popJson = await popRes.json();
    const gdpJson = await gdpRes.json();

    const popData = popJson[1];
    const gdpData = gdpJson[1];

    if (!Array.isArray(popData) || !Array.isArray(gdpData)) {
      throw new Error("Invalid response format from World Bank API");
    }

    const popMap: Record<string, number> = {};
    for (const r of popData) {
      if (r.value !== null && r.countryiso3code) {
        popMap[r.countryiso3code] = r.value;
      }
    }

    const gdpMap: Record<string, { gdp: number; year: number }> = {};
    for (const r of gdpData) {
      if (r.value !== null && r.countryiso3code) {
        gdpMap[r.countryiso3code] = {
          gdp: r.value,
          year: parseInt(r.date, 10) || 2023,
        };
      }
    }

    // Verify all 11 countries exist
    for (const iso of isoCodes) {
      if (!popMap[iso] || !gdpMap[iso]) {
        throw new Error(`Missing live data for ${iso}`);
      }
    }

    // Combine with 2025 emissions from fallbackRows
    const emissionsMap: Record<string, number> = {};
    for (const row of fallbackRows) {
      emissionsMap[row.Country] = row.Emissions_2025_Mt;
    }

    const rows: EconomicContextRow[] = isoCodes.map((iso) => {
      const country = ISO3_TO_COUNTRY[iso];
      const pop = popMap[iso];
      const gdpObj = gdpMap[iso];
      const emissions = emissionsMap[country] || 0;
      const tPerPerson = (emissions * 1e6) / pop;
      const kgPerUSD = (emissions * 1e9) / gdpObj.gdp;

      return {
        Country: country,
        Population: pop,
        GDP_USD: gdpObj.gdp,
        GDP_Year: gdpObj.year,
        Emissions_2025_Mt: emissions,
        t_per_person: tPerPerson,
        kg_per_USD_GDP: kgPerUSD,
      };
    });

    return {
      source: "Live: World Bank API",
      isLive: true,
      rows,
    };
  } catch {
    return {
      source: "Stored values (World Bank 2023)",
      isLive: false,
      rows: fallbackRows,
    };
  }
}

