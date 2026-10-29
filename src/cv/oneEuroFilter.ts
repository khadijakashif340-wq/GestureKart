/**
 * One-Euro Filter implementation for low-latency, jitter-free gesture tracking.
 * References: Casiez, G., Roussel, N. and Vogel, D. (2012)
 * 1 € filter: a simple speed-based low-pass filter for noisy input in interactive systems.
 */

function smoothingFactor(te: number, cutoff: number): number {
  const r = 2 * Math.PI * cutoff * te;
  return r / (r + 1);
}

function exponentialSmoothing(a: number, x: number, xPrev: number): number {
  return a * x + (1 - a) * xPrev;
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xPrev: number | null = null;
  private dxPrev: number = 0;
  private tPrev: number | null = null;

  constructor(minCutoff: number = 1.0, beta: number = 0.007, dCutoff: number = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  public reset(): void {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  public filter(x: number, timestamp: number = performance.now()): number {
    if (this.tPrev === null || this.xPrev === null) {
      this.xPrev = x;
      this.dxPrev = 0;
      this.tPrev = timestamp;
      return x;
    }

    const te = Math.max((timestamp - this.tPrev) / 1000.0, 1e-5);
    this.tPrev = timestamp;

    // Filter derivative
    const aD = smoothingFactor(te, this.dCutoff);
    const dx = (x - this.xPrev) / te;
    const dxHat = exponentialSmoothing(aD, dx, this.dxPrev);
    this.dxPrev = dxHat;

    // Filter signal
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = smoothingFactor(te, cutoff);
    const xHat = exponentialSmoothing(a, x, this.xPrev);
    this.xPrev = xHat;

    return xHat;
  }
}
