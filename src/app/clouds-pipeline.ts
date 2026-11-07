import { registerToolcraftRendererPipeline, type ToolcraftRendererPipelinePassContract } from "@/toolcraft/runtime";

export const cloudTargets = ["clouds.count", "clouds.clustering", "clouds.size", "clouds.variation", "clouds.band", "clouds.seed", "clouds.fill"] as const;
export const cloudPipeline = registerToolcraftRendererPipeline<{
  geometry: ToolcraftRendererPipelinePassContract<void>;
  export: ToolcraftRendererPipelinePassContract<void>;
}>()({
  runtimeId: "nice-clouds.illustrated",
  passes: [
    {
      id: "geometry", kind: "vector-build", runsOn: "main", output: "preview", quality: "full",
      inputs: [...cloudTargets, "timeline.currentTimeSeconds"], invalidatedBy: [...cloudTargets, "timeline.currentTimeSeconds"],
      cost: { dimensions: ["cloud-count"], frequency: "frame", relationship: "linear" },
      lifecycle: { cache: "none", resourceScope: "call" },
      sceneBounds: { kind: "intrinsic", reason: "A finite authored periodic cloud tile; wrap copies join its left and right artistic boundaries." },
    },
    {
      id: "export", kind: "export", runsOn: "export-only", output: "export", quality: "export",
      inputs: [...cloudTargets, "timeline.currentTimeSeconds"], invalidatedBy: [...cloudTargets, "timeline.currentTimeSeconds"],
      cost: { dimensions: ["cloud-count", "export-pixels"], frequency: "batch", relationship: "product" },
      lifecycle: { cache: "none", resourceScope: "call" },
    },
  ],
  interactionInvalidation: [
    { interaction: "initial-render", targets: cloudTargets, invalidates: ["geometry"] },
    { interaction: "control-drag", targets: cloudTargets.filter(t => t !== "clouds.fill"), invalidates: ["geometry"] },
    { interaction: "control-change", targets: ["clouds.fill"], invalidates: ["geometry"] },
    { interaction: "timeline-playback", targets: ["timeline.playback"], invalidates: ["geometry"] },
    { interaction: "timeline-scrub", targets: ["timeline.playback"], invalidates: ["geometry"] },
    { interaction: "viewport-drag", targets: ["canvas.viewport"], invalidates: [] },
    { interaction: "viewport-zoom", targets: ["canvas.viewport"], invalidates: [] },
    { interaction: "export", targets: ["actions.output"], invalidates: ["export"] },
  ],
});
