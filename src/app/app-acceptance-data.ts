import type { ToolcraftComponentAcceptance, ToolcraftControlSectionInventoryEntry, ToolcraftProductReadiness, ToolcraftTransferMode } from "./acceptance/types";
import { appSchema } from "./app-schema";
import { cloudTargets } from "./clouds-pipeline";

export const appTransferMode: ToolcraftTransferMode = {
  mode: "new-toolcraft-app", referenceInputs: [],
  animationIntent: { mode: "timeline-playback", loopDuration: { source: "product-derived", seconds: 40, evidence: "A 40-second full-width traverse gives the requested calm, constant rightward cloud drift." } },
};

export const appProductReadiness: ToolcraftProductReadiness = {
  mode: "product", productName: "Nice Clouds", productSummary: "A calm illustrated cloud motion studio.",
  requestedBehavior: "Irregular illustrated clouds drift smoothly left to right in the upper region, with a configurable background and seamless video export.",
  exportIntent: {
    image: { mode: "toolcraft-default" }, svg: { mode: "not-requested" },
    video: { mode: "user-requested", evidence: {
      source: "user-message", messageRef: "t3-thread:4bf09888-04cd-4ca5-8178-95bc07b54245/message:a3703a55-56bb-437a-b873-ee4acbfe9749",
      messageText: "buenas crack usa la $toolcraft-lab-architect para crear esto. quiero hacer un video de unas nubes pasando por un cielo transparente. estas nubes pasan de izuqierda a derecha de forma suave, dando sensación de calma, de forma caotica(desordenada, nubes separadas, nubes juntas, espacios grandes, espacios pequeños, variación en forma, tamaño y distancia vertical, unas mas arriba que otras y otras bajas, pero siempre estando en la parte superior. en la parte superior",
      quote: "quiero hacer un video de unas nubes pasando por un cielo transparente.",
    } },
  },
  viewInteraction: { mode: "non-spatial", reason: "Cloud silhouettes form a flat two-dimensional composition, not an editable three-dimensional scene." },
  interactionOwnership: cloudTargets.map(target => ({
    id: `${target}.properties`, capability: "property-edit", target, surface: "panel", selectionScope: { mode: "global" },
    evidence: { source: "usability-analysis", detail: "Procedural composition parameters are most discoverable in the panel; direct editing would obscure cloud output." },
    reason: "One global procedural parameter is edited precisely in the panel.",
    alternative: { surface: "canvas", reason: "Canvas handles would duplicate procedural parameter editing and clutter the composition." },
  })),
};

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  { id: "background", title: "Background", entityId: "background", entity: "Output background", groupingReason: "Runtime-owned fill inclusion and color form one output-background task.", targets: ["export.includeBackground", "appearance.background"], finiteSelectors: [{ target: "export.includeBackground", role: "parameter", reason: "Inclusion changes preview/PNG fill while video keeps the configured color." }] },
  { id: "clouds", title: "Clouds", entityId: "clouds", entity: "Cloud composition", groupingReason: "Distribution, silhouette variation and fill edit one seeded cloud field with a shared reset scope.", targets: cloudTargets, finiteSelectors: [{ target: "clouds.count", role: "parameter", reason: "Count changes the requested number of clouds without changing peer applicability." }] },
  ...["image", "video"].map(kind => ({ id: `runtime.${kind}-export`, title: `${kind === "image" ? "Image" : "Video"} Export`, entityId: `${kind}-export`, entity: `${kind} artifact`, groupingReason: "Runtime format and resolution configure one artifact.", targets: [`export.${kind}.format`, `export.${kind}.resolution`], finiteSelectors: ["format", "resolution"].map(field => ({ target: `export.${kind}.${field}`, role: "parameter" as const, reason: "Changes this artifact setting without changing peer applicability." })) })),
];

const row = (id: string, target: string, componentType: string, extra: Partial<ToolcraftComponentAcceptance> = {}): ToolcraftComponentAcceptance => ({
  id: id.startsWith("clouds.") || id === "clouds.persistence" ? id : `clouds.${id}`, target, componentType, kind: "control", automated: true,
  automatedTestName: "validates the complete cloud product contract",
  browser: { file: "e2e/product-clouds.spec.ts", testName: `browser: ${id.startsWith("clouds.") ? id : `clouds.${id}`}`, budget: "standard" },
  fixture: "Paused seeded illustrated cloud composition", userAction: `Edit ${target} through the visible runtime control.`,
  expectedObservable: "The requested cloud or runtime output changes and remains stable at a paused phase.", evidence: "rendered-pixels", ...extra,
});

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  ...cloudTargets.map(target => row(target, target, target === "clouds.fill" ? "color" : "slider", { interactionId: `${target}.properties` })),
  row("background.include", "export.includeBackground", "switch", { backgroundOutputCoverage: "all-required-background-output" }),
  row("background.color", "appearance.background", "color"),
  ...["export.image.format", "export.image.resolution", "export.video.format", "export.video.resolution"].map(target => row(target, target, "select", { optionCoverage: "each-visible-item", evidence: "exported-bytes", browser: { file: "e2e/product-clouds.spec.ts", testName: `browser: clouds.${target}`, budget: "extended-io" } })),
  row("canvas.size", "canvas.size.width", "canvas", { kind: "runtime", evidence: "exported-bytes", browser: { file: "e2e/product-clouds.spec.ts", testName: "browser: clouds.canvas.size", budget: "extended-io" } }),
  row("canvas.infinity", "canvas.infinity", "canvas", { kind: "runtime", evidence: "viewport-side-effect", infinityCanvasCoverage: "mode-continuity-and-restoration" }),
  row("canvas.infinity.image", "canvas.infinity", "canvas", { kind: "runtime", infinityCanvasCoverage: "scene-bounds-image-export", evidence: "exported-bytes", browser: { file: "e2e/product-clouds.spec.ts", testName: "browser: clouds.canvas.infinity.image", budget: "extended-io" } }),
  row("canvas.infinity.video", "canvas.infinity", "canvas", { kind: "runtime", infinityCanvasCoverage: "scene-bounds-video-export", evidence: "exported-bytes", browser: { file: "e2e/product-clouds.spec.ts", testName: "browser: clouds.canvas.infinity.video", budget: "extended-io" } }),
  row("timeline.playback", "timeline.playback", "timeline", { kind: "runtime", evidence: "timeline-output", timelineCoverage: "playback", timelinePlaybackCoverage: "all-playback-behavior", timelineLoopProof: { direction: "forward-only", durationChange: "reproved-after-edit", reversePlayback: "forbidden", seam: "first-last-match" } }),
  row("image.export", "actions.output", "panelActions", { actionCoverage: ["export.png", "export.video"], evidence: "exported-bytes", exportArtifactCoverage: "all-required-image-export-behavior", browser: { file: "e2e/product-clouds.spec.ts", testName: "browser: clouds.image.export", budget: "extended-io" } }),
  row("video.export", "actions.output", "panelActions", { actionCoverage: ["export.png", "export.video"], evidence: "exported-bytes", exportArtifactCoverage: "all-required-video-export-behavior", browser: { file: "e2e/product-clouds.spec.ts", testName: "browser: clouds.video.export", budget: "extended-io" } }),
  row("clouds.persistence", "canvas.size.width", "persistence", { kind: "runtime", evidence: "persistence-state", persistenceCoverage: "reload", persistenceSlices: appSchema.persistence.storage === "localStorage" ? appSchema.persistence.include : [], browser: { file: "e2e/product-clouds.spec.ts", testName: "browser: clouds.persistence", budget: "extended-io" } }),
];
