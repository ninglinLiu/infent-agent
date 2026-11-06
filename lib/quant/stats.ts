export function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

export function stdev(values: number[]) {
  if (values.length < 2) return 0
  const m = mean(values)
  return Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1))
}

export function correlation(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length)
  if (n < 3) return 0
  const ma = mean(a.slice(0, n)), mb = mean(b.slice(0, n))
  let cov = 0, va = 0, vb = 0
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma, db = b[i] - mb
    cov += da * db; va += da * da; vb += db * db
  }
  return va && vb ? cov / Math.sqrt(va * vb) : 0
}

/** OLS 斜率 cov(y,x)/var(x) */
export function beta(y: number[], x: number[]) {
  const n = Math.min(x.length, y.length)
  const mx = mean(x.slice(0, n)), my = mean(y.slice(0, n))
  let cov = 0, vx = 0
  for (let i = 0; i < n; i++) { cov += (x[i] - mx) * (y[i] - my); vx += (x[i] - mx) ** 2 }
  return vx ? cov / vx : 0
}

/** Abramowitz-Stegun 7.1.26，误差 < 1.5e-7 */
function erf(x: number) {
  const sign = x < 0 ? -1 : 1
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return sign * y
}

/** 相关系数显著性：t 统计量的双侧 p 值（样本 > 100 时正态近似足够）。 */
export function correlationPValue(r: number, n: number) {
  if (n < 4 || Math.abs(r) >= 1) return Math.abs(r) >= 1 ? 0 : 1
  const t = Math.abs(r) * Math.sqrt((n - 2) / (1 - r * r))
  return Math.max(0, Math.min(1, 1 - erf(t / Math.SQRT2)))
}

export function maxDrawdown(values: number[]) {
  let peak = values[0] ?? 0, peakAt = 0, worst = 0, from = 0, to = 0
  values.forEach((value, i) => {
    if (value > peak) { peak = value; peakAt = i }
    const dd = peak ? value / peak - 1 : 0
    if (dd < worst) { worst = dd; from = peakAt; to = i }
  })
  return { value: worst, from, to }
}

export function round(value: number, digits = 4) {
  const f = 10 ** digits
  return Math.round(value * f) / f
}
