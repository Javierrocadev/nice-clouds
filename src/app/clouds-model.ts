export type CloudSettings = Readonly<{
  count: number;
  clustering: number;
  size: number;
  variation: number;
  band: number;
  seed: number;
  morph: number;
}>;

export const cloudDefaults: CloudSettings = {
  count: 12, clustering: 0.65, size: 1, variation: 0.8, band: 0.35, seed: 42, morph: 0.35,
};

export type Cloud = Readonly<{
  x: number; y: number; width: number; height: number;
  crown: number; shoulder: number;
  progress?: number; morph?: number; phase?: number;
}>;

function seededRandom(seed: number) {
  let value = seed | 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let n = Math.imul(value ^ (value >>> 15), 1 | value);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

export function normalizeCloudTime(t: number): number {
  if (!Number.isFinite(t)) throw new Error("Cloud time must be finite.");
  return ((t % 1) + 1) % 1;
}

export function makeCloudLayout(settings: CloudSettings): readonly Cloud[] {
  const random = seededRandom(settings.seed);
  const centers = Array.from({ length: 4 }, () => random());
  return Array.from({ length: settings.count }, (_, index) => {
    const scatter = random();
    const clustered = normalizeCloudTime(centers[index % centers.length] + (random() - 0.5) * 0.2);
    const x = scatter * (1 - settings.clustering) + clustered * settings.clustering;
    const scale = settings.size * (1 + (random() - 0.5) * 1.1 * settings.variation);
    const width = 0.14 * scale;
    const height = Math.min(settings.band * 0.62, 0.11 * scale);
    const y = height / 2 + 0.012 + random() * Math.max(0, settings.band - height - 0.024);
    return {
      x, y, width, height,
      progress: 0, morph: settings.morph, phase: index * 2.399963229728653 + settings.seed * 0.01,
      crown: 0.42 + (random() - 0.5) * 0.22 * settings.variation,
      shoulder: 0.55 + (random() - 0.5) * 0.3 * settings.variation,
    };
  });
}

export function evaluateClouds(settings: CloudSettings, t: number): readonly Cloud[] {
  const progress = normalizeCloudTime(t);
  return makeCloudLayout(settings).map((cloud, index) => {
    const phase = index * 2.399963229728653 + settings.seed * 0.01;
    // Periodic drift varies speed by at most 12.6%, with matching position and
    // velocity at the seam. Subtracting the initial offset preserves the layout.
    const drift = 0.02 * (Math.sin(2 * Math.PI * progress + phase) - Math.sin(phase));
    return { ...cloud, progress, x: normalizeCloudTime(cloud.x + progress + drift) };
  });
}

export function readCloudSettings(values: Readonly<Record<string, unknown>>): CloudSettings {
  return {
    count: Number(values["clouds.count"] ?? cloudDefaults.count),
    clustering: Number(values["clouds.clustering"] ?? cloudDefaults.clustering),
    size: Number(values["clouds.size"] ?? cloudDefaults.size),
    variation: Number(values["clouds.variation"] ?? cloudDefaults.variation),
    band: Number(values["clouds.band"] ?? cloudDefaults.band),
    seed: Number(values["clouds.seed"] ?? cloudDefaults.seed),
    morph: Number(values["clouds.morph"] ?? cloudDefaults.morph),
  };
}
