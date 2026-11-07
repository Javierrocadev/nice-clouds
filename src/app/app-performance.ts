import { defineToolcraftPerformance, defineToolcraftSchemaDiscreteFixtureAdapter, defineToolcraftDiscreteFixtureAdapter, deriveToolcraftPerformancePaths, type ToolcraftEnvelopePerformanceConfig, type ToolcraftPerformanceScenario } from "@/toolcraft/runtime";
import { appSchema } from "./app-schema";
import { cloudPipeline } from "./clouds-pipeline";

const model = {
  rendererStrategy: "svg", usesCustomRenderer: true, rendererPipeline: cloudPipeline,
  rendererTechnique: {
    sourceRepresentation: "procedural-data", productRepresentation: "vector", previewRenderer: "svg", exportRenderer: "canvas-2d", rendererStrategy: "svg",
    previewExportDifferenceReason: "SVG retains crisp illustrated paths during viewport transforms; runtime image/video export rasterizes those same paths at artifact resolution.",
    intentionalRasterizationReason: "Requested video and default image delivery require runtime-owned raster encoding.",
    whyNotAlternativeStrategies: ["A shader/GPU backend is unnecessary for at most 24 bounded cloud silhouettes.", "Canvas preview would rerasterize simple vector geometry during zoom."],
    fidelityRisks: ["Preview and export must share identical cubic silhouette geometry and fill."],
    performanceRisks: ["4K video encoding remains runtime-owned batch work."],
    layers: [{ id: "clouds", kind: "product-foreground", content: ["geometry"], renderer: "svg", primitiveCount: "low", exportMode: "included", uiSelector: "[data-cloud-output]" }],
  },
  workloadEnvelope: { dimensions: [
    { id: "cloud-count", source: { kind: "schema-target", target: "clouds.count", workloadBoundary: "maximum" }, mapping: "direct", unit: "clouds", defaultValue: 12, interactiveMax: 24, batchMax: 24 },
    { id: "export-pixels", source: { kind: "schema-target", target: "export.image.resolution" }, mapping: "area", unit: "edge pixels", defaultValue: 4096, batchMax: 8192 },
  ] },
  fixtureAdapters: { dimensions: {
    "cloud-count": defineToolcraftDiscreteFixtureAdapter({ dimensionId: "cloud-count", domain: { kind: "schema-options", target: "clouds.count", optionValues: Array.from({ length: 21 }, (_, i) => String(i + 4)) }, entries: Array.from({ length: 21 }, (_, i) => ({ value: i + 4, appliedValue: String(i + 4) })) }),
    "export-pixels": defineToolcraftSchemaDiscreteFixtureAdapter(appSchema, { dimensionId: "export-pixels", target: "export.image.resolution", entries: [{ value: 2048, appliedValue: "2k" }, { value: 4096, appliedValue: "4k" }, { value: 8192, appliedValue: "8k" }] }),
  } },
  scenarios: [],
} as const satisfies ToolcraftEnvelopePerformanceConfig;

export const cloudPerformancePaths = deriveToolcraftPerformancePaths(appSchema, model);
export const appPerformance = defineToolcraftPerformance({
  ...model,
  scenarios: cloudPerformancePaths.map((path, i): ToolcraftPerformanceScenario => {
    const common = {
      id: `clouds.path.${i}`, pathId: path.id, coversTargets: path.targets,
      expectedObservable: "Cloud paths update at the requested phase and quality.", fixture: "Reachable illustrated cloud composition",
      uiSelector: path.interaction.startsWith("timeline-") ? '[aria-label="Playback position"]' : path.interaction.startsWith("control-") ? `[data-toolcraft-control-target="${path.targets[0]}"]` : "[data-cloud-output]",
      automated: true, automatedTestName: "reproduces irregular illustrated clouds from the same seed",
      browser: true, browserTestName: `browser perf: toolcraft path ${path.id}`,
    };
    return path.interaction === "export"
      ? { ...common, interaction: "export", actionValue: "export.png", completionEvidence: "download", controlLabel: "Export PNG" }
      : { ...common, interaction: path.interaction };
  }),
});
