import { describe, expect, it } from "vitest";
import { appAcceptance, validateProductAcceptanceCoverage } from "./app-acceptance";
import { appPerformance, cloudPerformancePaths } from "./app-performance";
import { appSchema } from "./app-schema";
import { cloudTargets } from "./clouds-pipeline";

describe("appSchema", () => {
  it("assembles the native Nice Clouds workspace without media or layers", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.upload).toBe(false);
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.controls?.sections[0]?.controls.settingsTransfer).toMatchObject({ target: "runtime.settingsTransfer", type: "settingsTransfer" });
    expect(appSchema.panels.controls?.sections[1]?.title).toBe("Settings");
    expect(appSchema.toolbar).toEqual({ history: true, radar: true, theme: true, zoom: true });
    expect(appSchema.assembly.commands).toEqual(expect.arrayContaining(["canvas.center", "canvas.setSize", "controls.reset", "history.undo", "history.redo"]));
  });
  it("keeps procedural cloud properties in one resettable section", () => {
    const section = appSchema.panels.controls?.sections.find(s => s.id === "clouds");
    expect(Object.values(section?.controls ?? {}).map(c => c.target)).toEqual(cloudTargets);
    expect(Object.values(section?.controls ?? {}).every(c => c.defaultValue !== undefined)).toBe(true);
  });
  it("enables native playback and requested raster artifacts without keyframes", () => {
    expect(appSchema.panels.timeline).toMatchObject({ enabled: true, mode: "playback" });
    expect(appSchema.assembly.capabilities).toContain("timeline.playback");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    const capabilities = appSchema.modulePlan.capabilities.map(c => c.capabilityId);
    expect(capabilities).toContain("artifact.image-export");
    expect(capabilities).toContain("artifact.video-export");
    expect(capabilities).not.toContain("artifact.svg-export");
  });
  it("covers every canonical renderer path with a functional catalog entry", () => {
    expect(appPerformance.scenarios.map(s => s.pathId)).toEqual(cloudPerformancePaths.map(p => p.id));
    expect(appPerformance.workloadEnvelope.dimensions.map(d => d.id)).toEqual(["cloud-count", "export-pixels"]);
  });
  it("declares production reload coverage for the cloud schema", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error(
        "Nice Clouds must persist user settings in localStorage.",
      );
    }
    expect(appSchema.persistence.include).toContain("canvas");
    expect(
      appAcceptance.find((entry) => entry.id === "clouds.persistence"),
    ).toMatchObject({
      automated: true,
      browser: {
        budget: "extended-io",
        file: "e2e/product-clouds.spec.ts",
      },
      evidence: "persistence-state",
      kind: "runtime",
      persistenceCoverage: "reload",
      persistenceSlices: appSchema.persistence.include,
      target: "canvas.size.width",
    });
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});
