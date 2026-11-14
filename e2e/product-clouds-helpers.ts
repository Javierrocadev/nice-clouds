import { expect, type Page } from "@playwright/test";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import { inspectToolcraftVideoDownload } from "./video-artifact-inspection";

export const sky = [156, 203, 223, 255] as const;
export const schedule = Array.from({ length: 30 }, (_, index) => ({ index, timeSeconds: index / 30, durationSeconds: 1 / 30 }));
export const field = (page: Page, target: string) => page.locator(`[data-toolcraft-control-target="${target}"]`);

export async function select(page: Page, target: string, label: string) {
  await field(page, target).getByRole("combobox").click();
  await page.getByRole("option", { name: label, exact: true }).click();
}

export async function openClouds(page: Page) {
  await page.goto("/");
  // Wait for the actual app to mount before binding proof to its runtime root.
  await page.getByRole("application", { name: "Canvas viewport" }).waitFor({ state: "visible" });
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.locator('[data-cloud-index="0"][data-cloud-wrap="0"]')).toBeAttached();
  const toggle = field(page, "panels.timeline.extended").getByRole("switch");
  if (await toggle.getAttribute("aria-checked") !== "true") await toggle.click();
  await expect(page.getByRole("button", { name: /^(Play|Pause) playback$/ })).toBeVisible();
  const pause = page.getByRole("button", { name: "Pause playback", exact: true });
  if (await pause.isVisible()) await pause.click();
  await page.getByRole("slider", { name: "Playback position" }).press("Home");
  await expect(page.getByRole("slider", { name: "Playback position" })).toHaveAttribute("aria-valuenow", "0");
  await expect(page.locator('[data-cloud-index="0"][data-cloud-wrap="0"]')).toHaveAttribute("data-timeline-progress", "0");
  return session;
}

export async function shortVideo(page: Page) {
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const editor = page.getByRole("textbox", { name: "timeline duration", exact: true });
  await editor.fill("1s");
  await editor.press("Enter");
  await expect(page.getByRole("slider", { name: "Playback position" })).toHaveAttribute("aria-valuemax", "1");
}

export async function download(page: Page, kind: "image" | "video") {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: kind === "image" ? /^Export (PNG|JPG)$/ : /^Export (MP4|WebM)$/ }).click();
  return pending;
}

export async function image(page: Page) {
  return inspectToolcraftImageDownload({ page, download: await download(page, "image"), backgroundRgba: sky });
}

export async function video(page: Page) {
  return inspectToolcraftVideoDownload({ page, download: await download(page, "video"), backgroundRgba: sky, schedule });
}

export async function setCanvas(page: Page, width: number, height: number) {
  await select(page, "canvas.aspectRatio", width / height === 4 / 3 ? "4:3" : "16:9");
  for (const [axis, value] of [["width", width], ["height", height]] as const) {
    const input = field(page, `canvas.size.${axis}`).getByRole("textbox");
    await input.fill(String(value));
    await input.press("Enter");
  }
}
