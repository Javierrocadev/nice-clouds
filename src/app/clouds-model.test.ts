import { describe, expect, it } from "vitest";
import { cloudDefaults, evaluateClouds, makeCloudLayout } from "./clouds-model";

describe("illustrated cloud model", () => {
  it("reproduces irregular illustrated clouds from the same seed", () => {
    const layout = makeCloudLayout(cloudDefaults);
    expect(layout).toEqual(makeCloudLayout(cloudDefaults));
    expect(layout).toHaveLength(cloudDefaults.count);
    expect(new Set(layout.map(c => c.width)).size).toBeGreaterThan(3);
    expect(new Set(layout.map(c => c.y)).size).toBeGreaterThan(3);
    expect(makeCloudLayout({ ...cloudDefaults, seed: 7 })).not.toEqual(layout);
  });

  it("moves right with subtle individual speeds and joins the loop continuously", () => {
    const a = evaluateClouds(cloudDefaults, 0.1);
    const b = evaluateClouds(cloudDefaults, 0.10001);
    for (let i = 0; i < a.length; i++) {
      const speed = ((b[i].x - a[i].x + 1) % 1) / 0.00001;
      expect(speed).toBeGreaterThan(0.87);
      expect(speed).toBeLessThan(1.13);
    }
    const speeds = a.map((cloud, i) => ((b[i].x - cloud.x + 1) % 1) / 0.00001);
    expect(Math.min(...speeds)).toBeLessThan(0.95);
    expect(Math.max(...speeds)).toBeGreaterThan(1.05);
    expect(evaluateClouds(cloudDefaults, 1)).toEqual(evaluateClouds(cloudDefaults, 0));
    expect(evaluateClouds(cloudDefaults, -0.25)).toEqual(evaluateClouds(cloudDefaults, 0.75));
    const end = evaluateClouds(cloudDefaults, 1 - 1e-7);
    const start = evaluateClouds(cloudDefaults, 0);
    end.forEach((cloud, i) => expect(Math.abs(cloud.x - start[i].x)).toBeLessThan(1e-6));
  });

  it("keeps individual drift forward and velocity continuous across every loop", () => {
    const step = 1e-5;
    const displacement = (a: number, b: number) => (b - a + 1) % 1;
    for (let frame = 0; frame <= 100; frame++) {
      const phase = frame / 100;
      const before = evaluateClouds(cloudDefaults, phase);
      const after = evaluateClouds(cloudDefaults, phase + step);
      before.forEach((cloud, i) => {
        const speed = displacement(cloud.x, after[i].x) / step;
        expect(speed).toBeGreaterThan(0.87);
        expect(speed).toBeLessThan(1.13);
      });
    }
    const end = evaluateClouds(cloudDefaults, 1 - step);
    const seam = evaluateClouds(cloudDefaults, 0);
    const start = evaluateClouds(cloudDefaults, step);
    seam.forEach((cloud, i) => {
      expect(displacement(end[i].x, cloud.x) / step)
        .toBeCloseTo(displacement(cloud.x, start[i].x) / step, 4);
    });
  });

  it("keeps complete silhouettes in the upper band at supported extremes", () => {
    for (const band of [0.2, 0.35, 0.5]) {
      for (const size of [0.6, 1, 1.8]) {
        const layout = makeCloudLayout({ ...cloudDefaults, count: 24, band, size });
        layout.forEach(cloud => {
          expect(cloud.y - cloud.height / 2).toBeGreaterThanOrEqual(0);
          expect(cloud.y + cloud.height / 2).toBeLessThanOrEqual(band + 1e-12);
        });
      }
    }
  });

  it("changes only the requested design properties", () => {
    const base = makeCloudLayout(cloudDefaults);
    expect(makeCloudLayout({ ...cloudDefaults, count: 6 })).toHaveLength(6);
    expect(makeCloudLayout({ ...cloudDefaults, clustering: 0 })).not.toEqual(base);
    expect(makeCloudLayout({ ...cloudDefaults, variation: 0 })).not.toEqual(base);
    expect(makeCloudLayout({ ...cloudDefaults, size: 1.5 })[0].width).toBeGreaterThan(base[0].width);
    expect(() => evaluateClouds(cloudDefaults, Number.NaN)).toThrow();
  });
});
