import { evaluateClouds, type CloudSettings, type Cloud } from "./clouds-model";

export function cloudCurves(cloud: Cloud): readonly (readonly [number, number, number, number, number, number])[] {
  return [
    [0, .92, 0, .53, .19, .52],
    [.15, .14, cloud.crown, .08, .5, .36],
    [.55, 0, .8, .04, .83, .43],
    [1, .37, 1, .91, .87, .92],
    [.68, 1, .3, 1, .12, .92],
  ];
}

export function cloudSilhouette(cloud: Cloud): string {
  return "M .12 .92 " + cloudCurves(cloud).map(curve => "C " + curve.join(" ")).join(" ") + " Z";
}

export function drawCloudFrame(
  context: CanvasRenderingContext2D,
  frame: Readonly<{ x: number; y: number; width: number; height: number }>,
  settings: CloudSettings, progress: number, fill: string,
): void {
  context.save();
  context.beginPath();
  context.rect(frame.x, frame.y, frame.width, frame.height);
  context.clip();
  context.fillStyle = fill;
  for (const cloud of evaluateClouds(settings, progress)) {
    for (const wrap of [-1, 0, 1]) {
      context.save();
      context.translate(frame.x + (cloud.x + wrap - cloud.width / 2) * frame.width, frame.y + (cloud.y - cloud.height / 2) * frame.height);
      context.scale(cloud.width * frame.width, cloud.height * frame.height);
      context.beginPath();
      context.moveTo(.12, .92);
      for (const curve of cloudCurves(cloud)) context.bezierCurveTo(...curve);
      context.closePath();
      context.fill();
      context.restore();
    }
  }
  context.restore();
}
