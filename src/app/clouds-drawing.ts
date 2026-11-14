import { evaluateClouds, normalizeCloudTime, type CloudSettings, type Cloud } from "./clouds-model";

type Point = readonly [number, number];
type Cubic = readonly [number, number, number, number, number, number];
export type CloudSubpath = Readonly<{ start: Point; curves: readonly Cubic[] }>;
export type CloudPaintLayer = Readonly<{ id: string; paths: readonly CloudSubpath[]; fill: string }>;
/** A disc inside the highlight layer that is guaranteed to be painted with the cloud fill color. */
export type CloudHighlightAnchor = Readonly<{ x: number; y: number; radius: number }>;

// Flat cartoon shading: saturated base, soft mid tone, then the configurable highlight color on top.
export const cloudShadeColors = { shadow: "#5BBBEA", mid: "#A8E2F8" } as const;
export type CloudShades = Readonly<{ shadow: string; mid: string }>;
export function readCloudShades(values: Readonly<Record<string, unknown>>): CloudShades {
  return { shadow: String(values["clouds.shadow"] ?? cloudShadeColors.shadow), mid: String(values["clouds.mid"] ?? cloudShadeColors.mid) };
}

type Lobe = Readonly<{ x: number; y: number; rx: number; ry: number; lower: boolean }>;

// Rounded secondary lobes break both the silhouette and internal shading edges.
// Analytic tangents keep every small tip smooth instead of polygonal or pointed.
function blob(cx: number, cy: number, rx: number, ry: number, arms: readonly number[] = [1, 1, 1, 1]): CloudSubpath {
  const phase = arms[0] * 6.1 + arms[2] * 2.3;
  const secondary = arms[1] * 4.7 + arms[3];
  const sample = (angle: number) => {
    const radius = 0.9 + 0.06 * Math.sin(5 * angle + phase) + 0.025 * Math.sin(3 * angle + secondary);
    const derivative = 0.3 * Math.cos(5 * angle + phase) + 0.075 * Math.cos(3 * angle + secondary);
    const cos = Math.cos(angle), sin = Math.sin(angle);
    return { x: cx + rx * radius * cos, y: cy + ry * radius * sin,
      dx: rx * (derivative * cos - radius * sin), dy: ry * (derivative * sin + radius * cos) };
  };
  const bounded = (x: number, y: number): Point => [
    Math.max(cx - rx, Math.min(cx + rx, x)), Math.max(cy - ry, Math.min(cy + ry, y)),
  ];
  const count = 16, step = Math.PI * 2 / count;
  const first = sample(0);
  const curves: Cubic[] = [];
  for (let index = 0; index < count; index++) {
    const a = sample(index * step), b = index === count - 1 ? first : sample((index + 1) * step);
    curves.push([...bounded(a.x + a.dx * step / 3, a.y + a.dy * step / 3),
      ...bounded(b.x - b.dx * step / 3, b.y - b.dy * step / 3), b.x, b.y]);
  }
  return { start: [first.x, first.y], curves };
}
function arcCubic(cx: number, cy: number, radius: number, from: number, to: number): { start: Point; curve: Cubic } {
  const k = (4 / 3) * Math.tan((to - from) / 4) * radius;
  const p0: Point = [cx + radius * Math.cos(from), cy + radius * Math.sin(from)];
  const p3: Point = [cx + radius * Math.cos(to), cy + radius * Math.sin(to)];
  return {
    start: p0,
    curve: [p0[0] - k * Math.sin(from), p0[1] + k * Math.cos(from), p3[0] + k * Math.sin(to), p3[1] - k * Math.cos(to), p3[0], p3[1]],
  };
}

// Pointed crescent hugging the lower edge of a puff: the swirl line cartoon clouds use to separate lobes.
function crescent(cx: number, cy: number, radius: number, centerAngle: number, halfSpan: number, depth: number): CloudSubpath {
  const outer = arcCubic(cx, cy, radius, centerAngle - halfSpan, centerAngle + halfSpan);
  const a = outer.start, b: Point = [outer.curve[4], outer.curve[5]];
  const sagitta = radius * (1 - Math.cos(halfSpan)) * depth;
  const half = radius * Math.sin(halfSpan);
  const innerRadius = (half * half + sagitta * sagitta) / (2 * sagitta);
  const mid: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const nx = Math.cos(centerAngle), ny = Math.sin(centerAngle);
  const icx = mid[0] + nx * (sagitta - innerRadius), icy = mid[1] + ny * (sagitta - innerRadius);
  const from = Math.atan2(b[1] - icy, b[0] - icx);
  let to = Math.atan2(a[1] - icy, a[0] - icx);
  while (to > from) to -= 2 * Math.PI;
  while (to < from - Math.PI) to += 2 * Math.PI;
  const inner = arcCubic(icx, icy, innerRadius, from, to);
  return { start: a, curves: [outer.curve, inner.curve] };
}

function buildCloud(cloud: Cloud, w: number, h: number, fill: string, shades: CloudShades = cloudShadeColors): { layers: readonly CloudPaintLayer[]; anchor: CloudHighlightAnchor } {
  const noise = (index: number) => {
    const value = Math.sin(index * 127.1 + cloud.crown * 311.7 + cloud.shoulder * 173.3) * 43758.5453;
    return value - Math.floor(value);
  };
  const pad = 0.03 * h;
  const base = 0.93 * h;
  const usable = base - pad;
  const tailLeft = noise(0) < 0.5;
  const bodyL = tailLeft ? w * (0.22 + 0.1 * noise(5)) : w * 0.06;
  const bodyR = tailLeft ? w * 0.95 : w * (0.68 + 0.1 * noise(6));
  // -1 lights the puffs from the upper left, +1 from the upper right.
  const light = noise(7) < 0.5 ? -1 : 1;

  const gauss = (x: number, center: number, spread: number) => Math.exp(-(((x - center) / spread) ** 2));
  const peakX = w * (0.38 + 0.24 * noise(1));
  const peakSpread = w * (0.15 + 0.1 * noise(2));
  const sideX = peakX + (noise(3) < 0.5 ? -1 : 1) * w * (0.2 + 0.1 * noise(4));
  const top = (x: number) => base - usable * Math.min(1, 0.2 + 0.8 * gauss(x, peakX, peakSpread) + 0.4 * gauss(x, sideX, w * 0.09));

  const fit = (lobe: Lobe): Lobe => ({
    ...lobe,
    x: Math.min(w - lobe.rx - 0.5, Math.max(lobe.rx + 0.5, lobe.x)),
    y: Math.min(h - lobe.ry - 0.5, Math.max(lobe.ry + 0.5, lobe.y)),
  });
  const span = bodyR - bodyL;
  const lobes: Lobe[] = [];
  // Upper pile: lobe sizes follow the uneven skyline.
  for (let index = 0; index < 11; index++) {
    const x = bodyL + span * ((index + 0.5 + (noise(10 + index) - 0.5) * 0.7) / 11);
    const available = base - top(x);
    const r = Math.min(0.4 * h, Math.max(0.075 * h, available * (0.3 + 0.2 * noise(30 + index))));
    lobes.push(fit({ x, y: top(x) + r, rx: r * (1 + 0.22 * noise(50 + index)), ry: r, lower: false }));
  }
  // Uneven lower puffs overlap the rounded support mass; no flat strip.
  for (let index = 0; index < 7; index++) {
    const x = bodyL + span * ((index + 0.5 + (noise(70 + index) - 0.5) * 0.5) / 7);
    const taper = 0.65 + 0.35 * Math.sin(Math.PI * (index + 0.5) / 7);
    const r = h * (0.12 + 0.1 * noise(90 + index)) * taper;
    // Do not align the lower tangents: separate center heights produce distinct
    // hanging volumes and recessed gaps instead of a scalloped horizontal shelf.
    const hanging = Math.sin(index * 1.35 + noise(630) * Math.PI * 2);
    lobes.push(fit({ x, y: base - 0.12 * h - r * 0.75 - h * 0.085 * hanging, rx: r * (1 + 0.25 * noise(110 + index)), ry: r, lower: true }));
  }
  const arms = (index: number) => [0, 1, 2, 3].map(q => 0.88 + 0.4 * noise(300 + index * 4 + q));
  const lit = (lobe: Lobe, index: number) => {
    const scale = lobe.lower ? 0.72 + 0.08 * noise(130 + index) : 0.58 + 0.14 * noise(130 + index);
    return {
      x: lobe.x + light * 0.07 * lobe.rx,
      y: lobe.y - (lobe.lower ? 0.2 : 0.22) * lobe.ry,
      rx: lobe.rx * scale, ry: lobe.ry * scale,
    };
  };
  const highlights = lobes.map(lit);

  // The tallest upper puff owns the guaranteed-clean highlight disc.
  let anchorIndex = 0;
  lobes.forEach((lobe, index) => { if (!lobe.lower && lobe.ry > lobes[anchorIndex].ry) anchorIndex = index; });
  const anchor = { x: highlights[anchorIndex].x, y: highlights[anchorIndex].y, radius: highlights[anchorIndex].ry * 0.8 };
  // Swirl crescents may not cross the anchor, so it stays a flat, exportable white probe area.
  const clearOfAnchor = (path: CloudSubpath) => {
    const xs = [path.start[0], ...path.curves.flatMap(c => [c[0], c[2], c[4]])];
    const ys = [path.start[1], ...path.curves.flatMap(c => [c[1], c[3], c[5]])];
    return Math.max(...xs) < anchor.x - anchor.radius || Math.min(...xs) > anchor.x + anchor.radius
      || Math.max(...ys) < anchor.y - anchor.radius || Math.min(...ys) > anchor.y + anchor.radius;
  };

  // Swirl crescents under each puff's highlight, mirrored with the light direction.
  const curls: CloudSubpath[] = [];
  lobes.forEach((lobe, index) => {
    if (index === anchorIndex || lobe.ry < 0.08 * h || noise(150 + index) < 0.15) return;
    const hl = highlights[index];
    const lean = 0.1 + 0.95 * noise(170 + index);
    const angle = light < 0 ? lean + 0.2 : Math.PI - lean - 0.2;
    const radius = hl.ry * (0.82 + 0.1 * noise(190 + index));
    const main = crescent(hl.x, hl.y, radius, angle, 1.1 + 0.35 * noise(210 + index), 0.5 + 0.15 * noise(230 + index));
    if (clearOfAnchor(main)) curls.push(main);
    if (lobe.ry > 0.2 * h) {
      const inner = crescent(hl.x + light * 0.12 * hl.rx, hl.y + 0.05 * hl.ry, radius * 0.5, angle + light * 0.5, 1.2, 0.55);
      if (clearOfAnchor(inner)) curls.push(inner);
    }
  });

  return {
    anchor,
    layers: [
      // Keep the connecting mass inside the cloud, above its lower contour.
      // Only the independently placed puffs should define the hanging underside.
      { id: "shadow", paths: [blob((bodyL + bodyR) / 2, base - h * (0.40 + 0.035 * noise(610)), span * 0.45, h * (0.18 + 0.025 * noise(620)), arms(600)), ...lobes.map((l, i) => blob(l.x, l.y, l.rx, l.ry, arms(i)))], fill: shades.shadow },
      {
        id: "mid",
        paths: [
          blob((bodyL + bodyR) / 2, base - h * (0.42 + 0.035 * noise(610)), span * 0.43, h * (0.16 + 0.025 * noise(620)), arms(600)),
          ...lobes.map((l, i) => blob(l.x, l.y - 0.07 * l.ry, l.rx * 0.93, l.ry * 0.93, arms(i))),
        ],
        fill: shades.mid,
      },
      { id: "body", paths: highlights.map((l, i) => blob(l.x, l.y, l.rx, l.ry, arms(i))), fill },
      { id: "curl", paths: curls, fill: shades.mid },
    ],
  };
}

// A continuous periodic displacement field reshapes the existing cubic artwork.
// Keeping topology and random inputs fixed avoids popping lobes/curls in and out.
function morphArtwork(layers: readonly CloudPaintLayer[], cloud: Cloud, w: number, h: number, anchor: CloudHighlightAnchor): readonly CloudPaintLayer[] {
  const amount = Math.max(0, Math.min(3, cloud.morph ?? 0));
  const progress = normalizeCloudTime(cloud.progress ?? 0);
  if (amount === 0) return layers;
  const phase = cloud.phase ?? 0;
  // A static contribution makes intensity visible even when paused at phase zero.
  // Integer temporal frequencies still join position and velocity at the seam.
  const wave = (offset: number, cycles = 1) => amount *
    (0.35 * Math.sin(phase + offset) + 0.65 * Math.sin(2 * Math.PI * cycles * progress + phase + offset));
  const breath = wave(0), lean = wave(2.1), roll = wave(4.3);
  return layers.map(layer => ({ ...layer, paths: layer.paths.map((path, index) => {
    const points = [path.start, ...path.curves.flatMap(c => [[c[0], c[1]], [c[2], c[3]], [c[4], c[5]]] as Point[])];
    const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]));
    const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));

    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const lobeIndex = layer.id === "shadow" || layer.id === "mid" ? index - 1 : index;
    const puff = layer.id === "body" || ((layer.id === "shadow" || layer.id === "mid") && index > 0);
    const pulse = puff ? 1 + 0.08 * wave(lobeIndex * 1.7) : 1;
    const point = (x: number, y: number): Point => {
      // Protect only the anchor neighborhood, not every path whose bounding box
      // overlaps it (which previously froze whole base and large puff paths).
      const distance = Math.hypot(x - anchor.x, y - anchor.y);
      const blend = Math.max(0, Math.min(1, (distance - anchor.radius * 1.4) / (anchor.radius * 1.2)));
      const influence = blend * blend * (3 - 2 * blend);
      const u = x / w, v = y / h;
      const edgeX = Math.sin(Math.PI * u) ** 2, edgeY = Math.sin(Math.PI * v) ** 2;
      const dx = w * 0.025 * edgeX * (0.6 * lean + 0.4 * roll * Math.sin(4 * Math.PI * v + phase));
      const dy = h * 0.06 * edgeY * (0.7 * breath * Math.sin(4 * Math.PI * u + phase) + 0.3 * roll);
      return [
        Math.max(0, Math.min(w, x + influence * ((x - cx) * (pulse - 1) + dx))),
        Math.max(0, Math.min(h, y + influence * ((y - cy) * (pulse - 1) + dy))),
      ];
    };
    return { start: point(...path.start), curves: path.curves.map(c => [
      ...point(c[0], c[1]), ...point(c[2], c[3]), ...point(c[4], c[5]),
    ] as Cubic) };
  }) }));
}

// Every control point stays inside the declared cloud box.
export function cloudArtwork(cloud: Cloud, width: number, height: number, fill: string, shades: CloudShades = cloudShadeColors): readonly CloudPaintLayer[] {
  const artwork = buildCloud(cloud, width, height, fill, shades);
  return morphArtwork(artwork.layers, cloud, width, height, artwork.anchor);
}

export function cloudHighlightAnchor(cloud: Cloud, width: number, height: number): CloudHighlightAnchor {
  return buildCloud(cloud, width, height, "#FFFFFF").anchor;
}

export function cloudLayerPath(layer: CloudPaintLayer): string {
  return layer.paths.map(path => `M ${path.start.join(" ")} ` + path.curves.map(curve => "C " + curve.join(" ")).join(" ") + " Z").join(" ");
}

export function drawCloudFrame(
  context: CanvasRenderingContext2D,
  frame: Readonly<{ x: number; y: number; width: number; height: number }>,
  settings: CloudSettings, progress: number, fill: string,
  shades: CloudShades = cloudShadeColors,
): void {
  context.save();
  context.beginPath();
  context.rect(frame.x, frame.y, frame.width, frame.height);
  context.clip();
  for (const cloud of evaluateClouds(settings, progress)) {
    const artwork = cloudArtwork(cloud, cloud.width * frame.width, cloud.height * frame.height, fill, shades);
    for (const wrap of [-1, 0, 1]) {
      context.save();
      context.translate(frame.x + (cloud.x + wrap - cloud.width / 2) * frame.width, frame.y + (cloud.y - cloud.height / 2) * frame.height);
      for (const layer of artwork) {
        context.beginPath();
        for (const path of layer.paths) {
          context.moveTo(...path.start);
          for (const curve of path.curves) context.bezierCurveTo(...curve);
          context.closePath();
        }
        context.fillStyle = layer.fill;
        context.fill();
      }
      context.restore();
    }
  }
  context.restore();
}
