import { describe, expect, it } from "vitest";
import { cloudDefaults, makeCloudLayout } from "./clouds-model";
import { cloudArtwork, cloudHighlightAnchor, cloudLayerPath, cloudShadeColors, type CloudPaintLayer } from "./clouds-drawing";

const layerPoints = (layer: CloudPaintLayer) => layer.paths.flatMap(path => [path.start, ...path.curves.flatMap(c => [[c[0], c[1]], [c[2], c[3]], [c[4], c[5]]] as const)]);
const byId = (layers: readonly CloudPaintLayer[], id: string) => layers.find(layer => layer.id === id)!;

describe("reference-inspired cartoon cloud illustration", () => {
  it("finishes the base with short rounded ends and a scalloped belly instead of a line", () => {
    for (const cloud of makeCloudLayout({ ...cloudDefaults, count: 24 })) {
      const base = cloudArtwork(cloud, 300, 160, "#FFFFFF")[0].paths[0];
      expect(base.curves.length).toBeGreaterThanOrEqual(10);
      const belly = base.curves.slice(3);
      expect(new Set(belly.map(curve => Math.round(curve[5] * 10))).size).toBeGreaterThan(3);
      expect(Math.max(...belly.map(curve => Math.abs(curve[4] - curve[0])))).toBeLessThan(60);
    }
  });
  it("shares flat blue shading, white highlights and swirl crescents across renderers", () => {
    const cloud = makeCloudLayout(cloudDefaults)[0];
    const artwork = cloudArtwork(cloud, 300, 160, "#FFFFFF");
    expect(artwork.slice(0, 3).map(layer => layer.id)).toEqual(["shadow", "mid", "body"]);
    expect(byId(artwork, "shadow").fill).toBe(cloudShadeColors.shadow);
    expect(byId(artwork, "mid").fill).toBe(cloudShadeColors.mid);
    expect(byId(artwork, "body").fill).toBe("#FFFFFF");
    expect(Object.keys(artwork[0])).not.toContain("stroke");
    expect(byId(artwork, "curl").paths.length).toBeGreaterThanOrEqual(1);
  });

  it("builds varied scalloped puffs, swirl crescents and bubbles", () => {
    const shapes = makeCloudLayout({ ...cloudDefaults, count: 24 }).map(cloud => cloudArtwork(cloud, 300, 160, "#FFFFFF"));
    for (const artwork of shapes) {
      expect(byId(artwork, "body").paths.length).toBeGreaterThanOrEqual(18);
      expect(byId(artwork, "curl").paths.length).toBeGreaterThanOrEqual(3);
      expect(byId(artwork, "satellite-dark").paths.length + byId(artwork, "satellite-light").paths.length).toBe(6);
      const tops = byId(artwork, "body").paths.map(path => Math.round(path.curves[2][5]));
      expect(new Set(tops).size).toBeGreaterThan(8);
    }
    expect(new Set(shapes.map(layers => cloudLayerPath(byId(layers, "shadow")))).size).toBeGreaterThan(15);
  });

  it("keeps every paint point inside each cloud's declared scene bounds", () => {
    for (const cloud of makeCloudLayout({ ...cloudDefaults, count: 24 })) {
      for (const layer of cloudArtwork(cloud, 300, 160, "#FFFFFF")) {
        for (const [x, y] of layerPoints(layer)) {
          expect(x).toBeGreaterThanOrEqual(-0.001);
          expect(x).toBeLessThanOrEqual(300.001);
          expect(y).toBeGreaterThanOrEqual(-0.001);
          expect(y).toBeLessThanOrEqual(160.001);
        }
      }
    }
  });

  it("exposes a highlight disc that is painted in the cloud fill color", () => {
    const cloud = makeCloudLayout(cloudDefaults)[0];
    const anchor = cloudHighlightAnchor(cloud, 300, 160);
    expect(anchor.radius).toBeGreaterThan(8);
    expect(anchor.x - anchor.radius).toBeGreaterThanOrEqual(0);
    expect(anchor.x + anchor.radius).toBeLessThanOrEqual(300);
    expect(anchor.y - anchor.radius).toBeGreaterThanOrEqual(0);
  });

  it("recolors every cloud layer while preserving geometry and shade contrast", () => {
    const cloud = makeCloudLayout(cloudDefaults)[0];
    const white = cloudArtwork(cloud, 300, 160, "#FFFFFF");
    const peach = cloudArtwork(cloud, 300, 160, "#FFDCB3");
    expect(byId(peach, "body").fill).toBe("#FFDCB3");
    expect(peach.map(layer => layer.paths)).toEqual(white.map(layer => layer.paths));
    const recolored = peach.filter((layer, index) => layer.fill !== white[index].fill).map(layer => layer.id);
    expect(recolored).toEqual(white.map(layer => layer.id));
    expect(byId(peach, "shadow").fill).toBe("#5BA1A4");
    expect(byId(peach, "mid").fill).toBe("#A8C3AE");
  });
});
