import { defineToolcraft, imageExportModule, timelineModule, videoExportModule, type ToolcraftControlSchema } from "@/toolcraft/runtime";

import appDefaults from "./app-defaults.json" with { type: "json" };
import { appIdentity } from "./app-identity";
import { cloudDefaults } from "./clouds-model";

const slider = (target: string, label: string, value: number, min: number, max: number, step: number): ToolcraftControlSchema => ({
  type: "slider", target, label, defaultValue: value, min, max, step,
  applicability: { mode: "always" }, keyframeable: false,
  sliderValueKind: step === 1 ? "discrete" : "continuous",
  ...(target === "clouds.count" ? { variant: "discrete" as const } : {}),
  editableRange: { hardMin: min, hardMax: max },
  performanceRole: target === "clouds.count" ? "workload" : "responsiveness",
  performanceReason: target === "clouds.count" ? "Each cloud adds a bounded silhouette and wrap copies." : "Changes the shared procedural cloud composition.",
});

export const appSchema = defineToolcraft({
  defaults: appDefaults,
  base: {
    canvas: {
      enabled: true,
      upload: false,
      sizing: { mode: "editable-output" },
    },
    identity: appIdentity,
    panels: {
      controls: {
        sections: [
          { id: "background", title: "Background", controls: {
            include: { type: "switch", target: "export.includeBackground", defaultValue: true, applicability: { mode: "always" }, performanceRole: "responsiveness", performanceReason: "Runtime-owned background composition." },
            color: { type: "color", target: "appearance.background", defaultValue: "#9CCBDF", applicability: { mode: "always" }, performanceRole: "responsiveness", performanceReason: "Runtime-owned background fill." },
          } },
          { id: "clouds", title: "Clouds", controls: {
            count: slider("clouds.count", "Count", cloudDefaults.count, 4, 24, 1),
            clustering: slider("clouds.clustering", "Clustering", cloudDefaults.clustering, 0, 1, 0.01),
            size: slider("clouds.size", "Size", cloudDefaults.size, 0.6, 1.8, 0.01),
            variation: slider("clouds.variation", "Variation", cloudDefaults.variation, 0, 1, 0.01),
            band: { ...slider("clouds.band", "Upper band", cloudDefaults.band, 0.2, 0.5, 0.01), description: "The full cloud silhouettes remain within this fraction of the composition height." },
            seed: slider("clouds.seed", "Seed", cloudDefaults.seed, 1, 9999, 1),
            fill: { type: "color", target: "clouds.fill", label: "Fill", defaultValue: "#FFFFFF", applicability: { mode: "always" }, keyframeable: false, performanceRole: "responsiveness", performanceReason: "Changes cloud fill without rebuilding layout." },
          } },
        ],
        title: "Controls",
      },
    },
    toolbar: {
      history: true,
      radar: true,
      zoom: true,
    },
  },
  modules: [imageExportModule(), videoExportModule(), timelineModule({ mode: "playback", defaultDurationSeconds: 40 })],
});
