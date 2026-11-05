/**
 * Number and currency formatting utilities following project specifications.
 */

export function formatUSDbn(valueUSDm: number, decimals = 1): string {
  if (valueUSDm === null || valueUSDm === undefined || isNaN(valueUSDm)) return "—";
  const bn = valueUSDm / 1000;
  return `US$ ${bn.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} bn`;
}

export function formatUSDm(valueUSDm: number, decimals = 1): string {
  if (valueUSDm === null || valueUSDm === undefined || isNaN(valueUSDm)) return "—";
  return `US$ ${valueUSDm.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}m`;
}

export function formatMt(valueMt: number, decimals = 1, suffix = "Mt/yr"): string {
  if (valueMt === null || valueMt === undefined || isNaN(valueMt)) return "—";
  const str = valueMt.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return suffix ? `${str} ${suffix}` : str;
}

export function formatPct(valuePct: number, decimals = 1): string {
  if (valuePct === null || valuePct === undefined || isNaN(valuePct)) return "—";
  return `${valuePct.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

export function formatNumber(val: number, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return val.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

