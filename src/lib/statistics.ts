// Statistical utilities for A/B testing

export function calculateConversionRate(installs: number, views: number): number {
  if (views === 0) return 0;
  return (installs / views) * 100;
}

export function calculateConfidenceInterval(
  conversions: number,
  total: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  if (total === 0) return { lower: 0, upper: 0 };

  const p = conversions / total;
  // Z-scores for common confidence levels
  const zScores: Record<number, number> = {
    0.9: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };
  const z = zScores[confidenceLevel] || 1.96;
  const margin = z * Math.sqrt((p * (1 - p)) / total);

  return {
    lower: Math.max(0, (p - margin) * 100),
    upper: Math.min(100, (p + margin) * 100),
  };
}

// Two-proportion z-test for comparing conversion rates
export function calculateSignificance(
  conversionsA: number,
  totalA: number,
  conversionsB: number,
  totalB: number
): { zScore: number; pValue: number; isSignificant: boolean } {
  if (totalA === 0 || totalB === 0) {
    return { zScore: 0, pValue: 1, isSignificant: false };
  }

  const pA = conversionsA / totalA;
  const pB = conversionsB / totalB;
  const pPooled = (conversionsA + conversionsB) / (totalA + totalB);
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / totalA + 1 / totalB));

  if (se === 0) return { zScore: 0, pValue: 1, isSignificant: false };

  const zScore = (pA - pB) / se;
  // Approximate two-tailed p-value using normal distribution
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  return {
    zScore,
    pValue,
    isSignificant: pValue < 0.05,
  };
}

// Standard normal CDF approximation
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

export function calculateLift(controlRate: number, variantRate: number): number {
  if (controlRate === 0) return 0;
  return ((variantRate - controlRate) / controlRate) * 100;
}

export function categorizeInstaller(secondsToAction: number): "decisive" | "exploratory" {
  return secondsToAction <= 7 ? "decisive" : "exploratory";
}
