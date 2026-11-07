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

  it("moves right at a constant speed and joins the loop continuously", () => {
    const a = evaluateClouds(cloudDefaults, 0.1);
    const b = evaluateClouds(cloudDefaults, 0.10001);
    for (let i = 0; i < a.length; i++) {
      expect(b[i].x - a[i].x).toBeCloseTo(0.00001, 8);
    }
    expect(evaluateClouds(cloudDefaults, 1)).toEqual(evaluateClouds(cloudDefaults, 0));
    expect(evaluateClouds(cloudDefaults, -0.25)).toEqual(evaluateClouds(cloudDefaults, 0.75));
    const end = evaluateClouds(cloudDefaults, 1 - 1e-7);
    const start = evaluateClouds(cloudDefaults, 0);
    end.forEach((cloud, i) => expect(Math.abs(cloud.x - start[i].x)).toBeLessThan(1e-6));
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
