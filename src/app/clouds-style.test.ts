import { describe, expect, it } from "vitest";
import { cloudDefaults, makeCloudLayout } from "./clouds-model";
import { cloudArtwork } from "./clouds-drawing";

describe("reference-inspired cloud illustration", () => {
  it("shares a gray outline, lower shadow and internal puff folds across renderers", () => {
    const cloud = makeCloudLayout(cloudDefaults)[0];
    const artwork = cloudArtwork(cloud, 300, 160, "#FFFFFF");
    expect(artwork.map(layer => layer.id)).toEqual(["shadow", "body", "fold-left", "fold-right"]);
    expect(artwork[0].fill).toBe("#555951");
    expect(artwork[1].fill).toBe("#FFFFFF");
    expect(artwork[1].stroke).toBe("#7A7D77");
    expect(artwork[1].strokeWidth).toBeGreaterThan(5);
    expect(artwork[1].curves.length).toBeGreaterThanOrEqual(9);
    expect(artwork[0].start[1]).toBeGreaterThan(artwork[1].start[1]);
  });

  it("keeps strokes and shadows inside each cloud's declared scene bounds", () => {
    for (const cloud of makeCloudLayout({ ...cloudDefaults, count: 24 })) {
      for (const layer of cloudArtwork(cloud, 300, 160, "#FFFFFF")) {
        const halfStroke = layer.strokeWidth / 2;
        const coordinates = [layer.start, ...layer.curves.flatMap(c => [[c[0], c[1]], [c[2], c[3]], [c[4], c[5]]])];
        for (const [x, y] of coordinates) {
          expect(x - halfStroke).toBeGreaterThanOrEqual(0);
          expect(x + halfStroke).toBeLessThanOrEqual(300);
          expect(y - halfStroke).toBeGreaterThanOrEqual(0);
          expect(y + halfStroke).toBeLessThanOrEqual(160);
        }
      }
    }
  });

  it("changes only the body fill when the cloud color is edited", () => {
    const cloud = makeCloudLayout(cloudDefaults)[0];
    const white = cloudArtwork(cloud, 300, 160, "#FFFFFF");
    const peach = cloudArtwork(cloud, 300, 160, "#FFDCB3");
    expect(peach[1].fill).toBe("#FFDCB3");
    expect(peach.map(({ fill: _fill, ...layer }) => layer)).toEqual(white.map(({ fill: _fill, ...layer }) => layer));
    expect(peach.filter(layer => layer.id !== "body")).toEqual(white.filter(layer => layer.id !== "body"));
  });
});
