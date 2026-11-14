import { test, expect } from "./toolcraft-product-test";
import { proveCloudPersistence } from "./product-clouds-persistence";
import { openClouds, field, select, shortVideo, download, image, video, setCanvas, sky, schedule } from "./product-clouds-helpers";
import { expectToolcraftProductObservableToChange, getToolcraftProductObservableSnapshot } from "./product-observable-helpers";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { expectToolcraftStandardTimelinePlayback } from "./browser-standard-timeline-evidence";
import { expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftImageExportArtifact, expectToolcraftVideoExportArtifact } from "./browser-media-export-evidence";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import { expectToolcraftBackgroundOutputSemantics } from "./browser-background-output-evidence";
import { expectToolcraftInfinityCanvasModeEvidence, expectToolcraftInfinityCanvasBackgroundEvidence, expectToolcraftInfinityCanvasImageExportEvidence, expectToolcraftInfinityCanvasVideoExportEvidence, observeInfinityCanvas, observeInfinityCanvasBackground } from "./browser-infinity-canvas-evidence";
import { dragToolcraftCanvasViewport } from "./performance-canvas-helpers";
import { evaluateClouds, cloudDefaults } from "../src/app/clouds-model";
import { cloudHighlightAnchor } from "../src/app/clouds-drawing";

const output = "[data-cloud-output]";
const marker = '[data-cloud-index="0"][data-cloud-wrap="0"]';

test("browser: clouds.persistence", async ({ page }) => {
  await proveCloudPersistence(page);
});

test("browser: clouds.illustrated-style", async ({ page }) => {
  const session = await openClouds(page);
  await select(page, "export.image.resolution", "2K");
  const artifact = await download(page, "image");
  await artifact.saveAs(".toolcraft/browser-artifacts/clouds-chaotic.png");
  const first = await inspectToolcraftImageDownload({ page, download: artifact, backgroundRgba: sky });
  const pixels = first.observation.normalizedPixels;
  const countColor = (color: readonly number[]) => {
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (color.every((value, channel) => Math.abs(pixels[i + channel] - value) < 6)) count++;
    }
    return count;
  };
  expect(countColor([255, 255, 255, 255])).toBeGreaterThan(20);
  expect(countColor([168, 226, 248, 255])).toBeGreaterThan(2);
  expect(countColor([91, 187, 234, 255])).toBeGreaterThan(2);
  expect(first.inspection.nonBackgroundBounds!.y + first.inspection.nonBackgroundBounds!.height).toBeLessThan(0.36);
  await expectToolcraftProductObservableToChange(session, session.controlAction("clouds.fill", async control => {
    await control.getByRole("textbox").fill("#FFDCB3");
    await control.getByRole("textbox").press("Enter");
  }), { requirementId: "clouds.illustrated-style", selector: output });
  await expect(page.locator('[data-cloud-layer="body"]').first()).toHaveAttribute("fill", "#FFDCB3");
  await expect(page.locator('[data-cloud-layer="body"]').first()).not.toHaveAttribute("stroke");
  await expect(page.locator('[data-cloud-layer="shadow"]').first()).toHaveAttribute("fill", "#5BA1A4");
  await expect(page.locator('[data-cloud-layer="mid"]').first()).toHaveAttribute("fill", "#A8C3AE");
});

for (const target of ["clouds.count", "clouds.clustering", "clouds.size", "clouds.variation", "clouds.band", "clouds.seed"]) {
  test(`browser: ${target.startsWith("clouds.") ? target : `clouds.${target}`}`, async ({ page }) => {
    const session = await openClouds(page);
    if (target === "clouds.count") await expectToolcraftDiscreteSliderMarkers(page, target);
    await expectToolcraftProductObservableToChange(session, session.controlAction(target, async control => {
      const slider = control.locator('[data-slot="slider"]').first();
      await slider.scrollIntoViewIfNeeded();
      const box = await slider.boundingBox();
      if (!box) throw new Error("Cloud slider is not measurable.");
      const before = await getToolcraftProductObservableSnapshot(page, { selector: output });
      const oldValue = await control.getByRole("slider").inputValue();
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
      await page.mouse.down();
      try {
        await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2, { steps: 8 });
        await expect.poll(() => control.getByRole("slider").inputValue()).not.toBe(oldValue);
        await expect.poll(() => getToolcraftProductObservableSnapshot(page, { selector: output })).not.toBe(before);
      } finally { await page.mouse.up(); }
    }), { requirementId: target, selector: output });
  });
}

for (const [id, target, value] of [["clouds.fill", "clouds.fill", "#FFDCB3"], ["background.color", "appearance.background", "#B4A4D9"]] as const) {
  test(`browser: ${id.startsWith("clouds.") ? id : `clouds.${id}`}`, async ({ page }) => {
    const session = await openClouds(page);
    await expectToolcraftProductObservableToChange(session, session.controlAction(target, async control => {
      await control.getByRole("textbox").fill(value);
      await control.getByRole("textbox").press("Enter");
    }), { requirementId: id.startsWith("clouds.") ? id : `clouds.${id}`, selector: id === "background.color" ? "[data-toolcraft-editable-canvas]" : output });
  });
}

test("browser: clouds.timeline.playback", async ({ page }) => {
  const session = await openClouds(page);
  const scrubber = page.getByRole("slider", { name: "Playback position" });
  await select(page, "export.image.resolution", "2K");
  const initial = (await image(page)).inspection.decodedPixelHash;
  const x = await page.locator(marker).evaluate(n => n.getBoundingClientRect().x);
  const secondCloud = page.locator('[data-cloud-index="1"][data-cloud-wrap="0"]');
  const secondX = await secondCloud.evaluate(n => n.getBoundingClientRect().x);
  await scrubber.press("ArrowRight");
  await expect.poll(() => page.locator(marker).evaluate(n => n.getBoundingClientRect().x)).toBeGreaterThan(x);
  const firstDistance = await page.locator(marker).evaluate(n => n.getBoundingClientRect().x) - x;
  const secondDistance = await secondCloud.evaluate(n => n.getBoundingClientRect().x) - secondX;
  expect(secondDistance).toBeGreaterThan(0);
  expect(Math.abs(firstDistance - secondDistance)).toBeGreaterThan(0.001);
  expect((await image(page)).inspection.decodedPixelHash).not.toBe(initial);
  await scrubber.press("End");
  expect((await image(page)).inspection.decodedPixelHash).toBe(initial);
  await expectToolcraftStandardTimelinePlayback(session, { markerSelector: marker, requirementId: "clouds.timeline.playback" });
});

for (const target of ["export.image.format", "export.image.resolution"]) {
  test(`browser: clouds.${target}`, async ({ page }) => {
    const session = await openClouds(page);
    for (const option of target.endsWith("format") ? ["JPG", "PNG"] : ["2K", "4K", "8K"]) {
      await select(page, target, option);
      await expectToolcraftExportedArtifact(session.targetAction(target, () => download(page, "image")), async artifact => {
        const result = await inspectToolcraftImageDownload({ page, download: artifact, backgroundRgba: sky });
        expect(result.inspection.nonBackgroundBounds).not.toBeNull();
        if (target.endsWith("resolution")) expect(result.inspection.width).toBe(({ "2K": 2048, "4K": 4096, "8K": 8192 } as Record<string, number>)[option]);
        else expect(result.inspection.mediaType).toBe(option === "PNG" ? "image/png" : "image/jpeg");
        return result.inspection;
      }, { requirementId: `clouds.${target}` });
    }
  });
}

for (const target of ["export.video.format", "export.video.resolution"]) {
  test(`browser: clouds.${target}`, async ({ page }) => {
    const session = await openClouds(page);
    await shortVideo(page);
    await setCanvas(page, 640, 360);
    for (const option of target.endsWith("format") ? ["WebM", "MP4"] : ["Current", "4K"]) {
      await select(page, target, option);
      await expectToolcraftExportedArtifact(session.targetAction(target, () => video(page)), artifact => {
        expect(artifact.inspection.frameCount).toBe(30);
        expect(new Set(artifact.inspection.samplePixelHashes).size).toBeGreaterThan(1);
        if (target.endsWith("resolution")) expect(artifact.inspection.width).toBe(option === "4K" ? 3840 : 640);
        else expect(artifact.inspection.mediaType).toBe(option === "MP4" ? "video/mp4" : "video/webm");
        return artifact.inspection;
      }, { requirementId: `clouds.${target}` });
    }
  });
}

function productPixel(progress: number) {
  // Probe the largest cloud's guaranteed highlight disc with a whole 64px observation cell,
  // so neither export resampling nor the pixel-grid rounding can reach a shaded edge.
  const frameWidth = 1920, frameHeight = 1080, cells = 64;
  const all = evaluateClouds(cloudDefaults, progress);
  const probes = all.filter(c => c.x > 0.1 && c.x < 0.9).map(cloud => {
    const anchor = cloudHighlightAnchor(cloud, cloud.width * frameWidth, cloud.height * frameHeight);
    return { cloud, anchor, centerX: (cloud.x - cloud.width / 2) * frameWidth + anchor.x, centerY: (cloud.y - cloud.height / 2) * frameHeight + anchor.y };
  });
  // Only clouds whose highlight disc is not covered by any other cloud (including seam copies) qualify.
  const clear = probes.filter(({ cloud, anchor, centerX, centerY }) => all.every(other => other === cloud || [-1, 0, 1].every(wrap => {
    const left = (other.x + wrap - other.width / 2) * frameWidth, top = (other.y - other.height / 2) * frameHeight;
    return centerX + anchor.radius < left || centerX - anchor.radius > left + other.width * frameWidth
      || centerY + anchor.radius < top || centerY - anchor.radius > top + other.height * frameHeight;
  })));
  const { anchor, centerX, centerY } = clear.sort((a, b) => b.cloud.width * b.cloud.height - a.cloud.width * a.cloud.height)[0];
  const cellWidth = frameWidth / cells, cellHeight = frameHeight / cells;
  let best: { column: number; row: number; reach: number } | undefined;
  for (let column = Math.floor(centerX / cellWidth) - 2; column <= Math.floor(centerX / cellWidth) + 2; column++) {
    for (let row = Math.floor(centerY / cellHeight) - 2; row <= Math.floor(centerY / cellHeight) + 2; row++) {
      const reach = Math.max(...[0, 1].flatMap(dx => [0, 1].map(dy => Math.hypot((column + dx) * cellWidth - centerX, (row + dy) * cellHeight - centerY))));
      if (!best || reach < best.reach) best = { column, row, reach };
    }
  }
  expect(best!.reach).toBeLessThan(anchor.radius);
  return { xRatio: (best!.column + 0.5) / cells, yRatio: (best!.row + 0.5) / cells, rgba: [255, 255, 255, 255] as const };
}

test("browser: clouds.image.export", async ({ page }) => {
  const session = await openClouds(page);
  await select(page, "export.image.resolution", "2K");
  await expectToolcraftImageExportArtifact(session.targetAction("actions.output", () => download(page, "image")), {
    page, requirementId: "clouds.image.export", backgroundRgba: sky, expectedWidth: 2048, expectedHeight: 1152, expectedMediaType: "image/png",
    expectedBounds: { x: 0.36, y: 0.01, width: 0.52, height: 0.28 }, expectedPixels: [productPixel(0)],
  });
});

test("browser: clouds.video.export", async ({ page }) => {
  const session = await openClouds(page);
  await shortVideo(page);
  await setCanvas(page, 640, 360);
  await expectToolcraftVideoExportArtifact(session.targetAction("actions.output", () => download(page, "video")), {
    page, requirementId: "clouds.video.export", backgroundRgba: sky, expectedWidth: 640, expectedHeight: 360, expectedMediaType: "video/mp4", expectedDurationSeconds: 1, animated: true, schedule,
    expectedSamples: [0, 0.5, 29 / 30].map(timeSeconds => ({ timeSeconds, pixels: [productPixel(timeSeconds)] })),
  });
});

test("browser: clouds.canvas.size", async ({ page }) => {
  const session = await openClouds(page);
  await setCanvas(page, 800, 600);
  await select(page, "export.image.resolution", "2K");
  await expectToolcraftExportedArtifact(session.targetAction("canvas.size.width", () => image(page)), artifact => {
    expect(artifact.inspection.width).toBe(2048);
    expect(artifact.inspection.height).toBe(1536);
    expect(artifact.inspection.nonBackgroundBounds).not.toBeNull();
    return artifact.inspection;
  }, { requirementId: "clouds.canvas.size" });
});

test("browser: clouds.canvas.infinity.image", async ({ page }) => {
  await openClouds(page);
  await select(page, "export.image.resolution", "2K");
  const finite = (await image(page)).inspection;
  await field(page, "canvas.infinity").getByRole("switch").click();
  const infinite = (await image(page)).inspection;
  await expectToolcraftInfinityCanvasImageExportEvidence({ finite, infinite }, { requirementId: "clouds.canvas.infinity.image", target: "canvas.infinity", expectedSize: { finite: { width: 2048, height: 1152 }, infinite: { width: 2048, height: 1152 } } });
});

test("browser: clouds.canvas.infinity.video", async ({ page }) => {
  await openClouds(page);
  await shortVideo(page);
  await setCanvas(page, 640, 360);
  const finite = (await video(page)).inspection;
  await field(page, "canvas.infinity").getByRole("switch").click();
  const infinite = (await video(page)).inspection;
  await expectToolcraftInfinityCanvasVideoExportEvidence({ finite, infinite }, { requirementId: "clouds.canvas.infinity.video", target: "canvas.infinity", expectedSize: { finite: { width: 640, height: 360 }, infinite: { width: 640, height: 360 } } });
});

test("browser: clouds.background.include", async ({ page }) => {
  const session = await openClouds(page);
  await shortVideo(page);
  await setCanvas(page, 640, 360);
  await select(page, "export.image.resolution", "2K");
  const preview = session.observe(root => {
    const included = root.querySelector('[data-toolcraft-control-target="export.includeBackground"] [role="switch"]')?.getAttribute("aria-checked") === "true";
    const background = root.querySelector<HTMLElement>("[data-toolcraft-finite-background-layer]");
    return { backgroundVisible: included, outputSignature: background ? getComputedStyle(background).backgroundColor : "transparent" };
  });
  await expectToolcraftBackgroundOutputSemantics(preview, session.controlAction("export.includeBackground", control => control.getByRole("switch").click()), { backgroundVisible: false, outputSignature: "transparent" }, session.targetAction("actions.output", () => download(page, "image")), async artifact => {
    const result = await inspectToolcraftImageDownload({ page, download: artifact, backgroundRgba: [0, 0, 0, 0] });
    return { ...result.inspection, backgroundAlpha: result.observation.normalizedPixels[(63 * 64 + 63) * 4 + 3]! };
  }, { requirementId: "clouds.background.include", video: { exportArtifact: session.targetAction("actions.output", () => video(page)), inspectArtifact: artifact => {
    const pixel = artifact.observations[0]!.normalizedPixels.slice((63 * 64 + 63) * 4, (63 * 64 + 63) * 4 + 4);
    for (let i = 0; i < 4; i++) expect(Math.abs(pixel[i]! - sky[i]!)).toBeLessThanOrEqual(3);
    return { ...artifact.inspection, backgroundIncluded: true };
  } } });
  await field(page, "export.includeBackground").getByRole("switch").click();
  await field(page, "canvas.infinity").getByRole("switch").click();
  const infinite = await observeInfinityCanvasBackground(page);
  await field(page, "export.includeBackground").getByRole("switch").click();
  const backgroundExcluded = await observeInfinityCanvasBackground(page);
  await field(page, "export.includeBackground").getByRole("switch").click();
  const backgroundRestored = await observeInfinityCanvasBackground(page);
  await expectToolcraftInfinityCanvasBackgroundEvidence({ infinite, backgroundExcluded, backgroundRestored }, { expectedBackgroundColor: "#9CCBDF", requirementId: "clouds.background.include", target: "export.includeBackground" });
});

test("browser: clouds.canvas.infinity", async ({ page }) => {
  await openClouds(page);
  const host = await page.locator("[data-toolcraft-product-scene]").elementHandle();
  const svg = await page.locator(output).elementHandle();
  const continuity = async () => ({ productHostPreserved: await host!.evaluate(n => n === document.querySelector("[data-toolcraft-product-scene]")), productOutputPreserved: await svg!.evaluate(n => n === document.querySelector("[data-cloud-output]")) });
  const before = await observeInfinityCanvas(page);
  await field(page, "canvas.infinity").getByRole("switch").click();
  const enabled = await observeInfinityCanvas(page);
  const beforeToEnabled = await continuity();
  await dragToolcraftCanvasViewport(page, { x: 80, y: -35 });
  const afterPan = await observeInfinityCanvas(page);
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.locator(marker)).toBeAttached();
  const afterReload = await observeInfinityCanvas(page);
  const reloadedHost = await page.locator("[data-toolcraft-product-scene]").elementHandle();
  const reloadedSvg = await page.locator(output).elementHandle();
  const reloadedContinuity = async () => ({ productHostPreserved: await reloadedHost!.evaluate(n => n === document.querySelector("[data-toolcraft-product-scene]")), productOutputPreserved: await reloadedSvg!.evaluate(n => n === document.querySelector("[data-cloud-output]")) });
  await field(page, "canvas.infinity").getByRole("switch").click();
  const restored = await observeInfinityCanvas(page);
  const afterReloadToRestored = await reloadedContinuity();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  const undone = await observeInfinityCanvas(page);
  const restoredToUndone = await reloadedContinuity();
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  const redone = await observeInfinityCanvas(page);
  const undoneToRedone = await reloadedContinuity();
  await expectToolcraftInfinityCanvasModeEvidence({ before, enabled, afterPan, afterReload, restored, undone, redone }, { beforeToEnabled, afterReloadToRestored, restoredToUndone, undoneToRedone }, { requirementId: "clouds.canvas.infinity", target: "canvas.infinity", expectedSceneRect: { x: -960, y: -540, width: 1920, height: 1080 } });
});
