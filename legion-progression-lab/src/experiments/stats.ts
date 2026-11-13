/**
 * Summary statistics for experiment reports (experiment plan principle 6). Pure and deterministic.
 * - Quantiles: nearest rank on the sorted values; a "not reached" value (null) sorts above every number, so a
 *   quantile that lands on one is itself "not reached" (null). Nothing is interpolated or imputed.
 * - Binomial acceptance interval: exact, two-sided, from the binomial distribution in log space.
 * - Two-sample Kolmogorov-Smirnov statistic with the asymptotic critical value c(alpha) * sqrt((n+m)/(n*m)).
 */

export function quantile(values: readonly (number | null)[], q: number): number | null {
  if (values.length === 0) return null;
  const nums = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil(q * values.length)); // nearest rank, 1-based
  return rank <= nums.length ? (nums[rank - 1] as number) : null;
}

export function mean(values: readonly (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return null;
  let s = 0;
  for (const v of nums) s += v;
  return s / nums.length;
}

export interface Summary {
  readonly n: number;
  readonly reached: number;
  readonly p10: number | null;
  readonly p50: number | null;
  readonly p90: number | null;
  readonly mean: number | null;
  readonly min: number | null;
  readonly max: number | null;
}

export function summarise(values: readonly (number | null)[]): Summary {
  const nums = values.filter((v): v is number => v !== null);
  return {
    n: values.length,
    reached: nums.length,
    p10: quantile(values, 0.1),
    p50: quantile(values, 0.5),
    p90: quantile(values, 0.9),
    mean: mean(values),
    min: nums.length ? nums.reduce((a, b) => (b < a ? b : a)) : null,
    max: nums.length ? nums.reduce((a, b) => (b > a ? b : a)) : null,
  };
}

/** Exact two-sided acceptance interval [lo, hi] for Binomial(n, p): P(X < lo) <= alpha/2 and P(X > hi) <= alpha/2. */
export function binomialInterval(n: number, p: number, alpha: number): { lo: number; hi: number } {
  if (p <= 0) return { lo: 0, hi: 0 };
  if (p >= 1) return { lo: n, hi: n };
  const logP = Math.log(p);
  const logQ = Math.log1p(-p);
  const logPmf: number[] = new Array(n + 1);
  let acc = n * logQ;
  logPmf[0] = acc;
  for (let k = 0; k < n; k += 1) {
    acc += Math.log(n - k) - Math.log(k + 1) + logP - logQ;
    logPmf[k + 1] = acc;
  }
  let max = Number.NEGATIVE_INFINITY;
  for (const l of logPmf) if (l > max) max = l; // a loop: spreading 10^5+ values would overflow the call stack
  const w = logPmf.map((l) => Math.exp(l - max));
  let total = 0;
  for (const x of w) total += x;
  let lo = 0;
  let cdf = 0;
  while (lo < n && cdf + (w[lo] as number) / total <= alpha / 2) cdf += (w[lo++] as number) / total;
  let hi = n;
  let tail = 0;
  while (hi > 0 && tail + (w[hi] as number) / total <= alpha / 2) tail += (w[hi--] as number) / total;
  return { lo, hi };
}

/** Two-sample KS: statistic D and the critical value at alpha = 0.001 (c = 1.949). */
export function ksTwoSample(a: readonly number[], b: readonly number[]): { d: number; critical: number; differs: boolean } {
  const x = [...a].sort((p, q) => p - q);
  const y = [...b].sort((p, q) => p - q);
  let i = 0;
  let j = 0;
  let d = 0;
  while (i < x.length && j < y.length) {
    const v = Math.min(x[i] as number, y[j] as number);
    while (i < x.length && (x[i] as number) <= v) i += 1;
    while (j < y.length && (y[j] as number) <= v) j += 1;
    d = Math.max(d, Math.abs(i / x.length - j / y.length));
  }
  const critical = 1.949 * Math.sqrt((x.length + y.length) / (x.length * y.length));
  return { d, critical, differs: d > critical };
}
