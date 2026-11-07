import type {
  ToolcraftPerformanceCanvasBacking,
  ToolcraftPerformancePathAdapter,
} from "./performance-path-adapter-contract";
import { cloudPerformancePaths } from "../src/app/app-performance";
import { expect } from "@playwright/test";
import { openClouds, select, field } from "./product-clouds-helpers";
import { getToolcraftProductObservableSnapshot } from "./product-observable-helpers";
import { dragToolcraftSliderByTarget, dragToolcraftSliderTargetToValue } from "./performance-slider-helpers";
import { dragToolcraftCanvasViewport, zoomToolcraftCanvasViewport } from "./performance-canvas-helpers";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";

export const appPerformanceCanvasBacking:
  | ToolcraftPerformanceCanvasBacking
  | undefined = undefined;

export const appPerformancePathAdapters: readonly ToolcraftPerformancePathAdapter[] = cloudPerformancePaths.map(path => {
  const base = {
    pathId: path.id,
    prepare: async (page: Parameters<typeof openClouds>[0]) => { await openClouds(page); },
    fixtureApplications: (page: Parameters<typeof openClouds>[0]) => Object.fromEntries(path.workloadDimensions.map(id => [id, id === "cloud-count" ? {
      applyValue: async (value: unknown) => { await dragToolcraftSliderTargetToValue(page, "clouds.count", Number(value)); },
      observeValue: async () => field(page, "clouds.count").getByRole("slider").inputValue(),
    } : {
      applyValue: async (value: unknown) => { await select(page, "export.image.resolution", String(value).toUpperCase()); },
      observeValue: async () => field(page, "export.image.resolution").locator("input").inputValue(),
    }])),
    observeOutcome: ({ page }: { page: Parameters<typeof openClouds>[0] }) => getToolcraftProductObservableSnapshot(page, { selector: "[data-cloud-output]" }),
  };
  if (path.interaction === "export") return { ...base, output: { kind: "download", label: "Export PNG", verify: async (download, page) => {
    const inspected = await inspectToolcraftImageDownload({ page, download, backgroundRgba: [156, 203, 223, 255] });
    expect(inspected.inspection.nonBackgroundBounds).not.toBeNull();
  } } };
  return { ...base, action: async ({ page }) => {
    if (path.interaction === "control-drag") await dragToolcraftSliderByTarget(page, path.targets[0]!, 0.75, { pathId: path.id });
    else if (path.interaction === "control-change") { const input = field(page, "clouds.fill").getByRole("textbox"); await input.fill("#FFE9CC"); await input.press("Enter"); }
    else if (path.interaction === "timeline-playback") await page.getByRole("button", { name: "Play playback", exact: true }).click();
    else if (path.interaction === "timeline-scrub") await page.getByRole("slider", { name: "Playback position" }).press("ArrowRight");
    else if (path.interaction === "viewport-drag") await dragToolcraftCanvasViewport(page, undefined, { pathId: path.id });
    else if (path.interaction === "viewport-zoom") await zoomToolcraftCanvasViewport(page, { direction: "in", pathId: path.id });
    else await expect(page.locator("[data-cloud-output] path").first()).toBeAttached();
  } };
});
