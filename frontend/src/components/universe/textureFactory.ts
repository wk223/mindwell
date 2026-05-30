import * as THREE from "three";
import type { PlanetType } from "../../types/universe";

type RGB = [number, number, number];

interface PlanetVisualProfile {
  base: RGB;
  deep: RGB;
  land: RGB;
  cloud: RGB;
  accent: RGB;
  atmosphere: string;
  emissive: string;
  roughness: number;
  metalness: number;
  cloudOpacity: number;
  cityLight: RGB;
  emissionStrength: number;
}

const SIZE = 512;
const texCache = new Map<string, THREE.CanvasTexture>();

const PROFILES: Record<PlanetType, PlanetVisualProfile> = {
  calm: {
    base: [58, 128, 154],
    deep: [12, 38, 62],
    land: [82, 166, 132],
    cloud: [216, 249, 244],
    accent: [121, 211, 252],
    atmosphere: "#7dd3fc",
    emissive: "#082f49",
    roughness: 0.68,
    metalness: 0.02,
    cloudOpacity: 0.18,
    cityLight: [112, 225, 255],
    emissionStrength: 0.18,
  },
  happy: {
    base: [171, 96, 32],
    deep: [76, 37, 12],
    land: [227, 171, 73],
    cloud: [255, 241, 190],
    accent: [250, 204, 21],
    atmosphere: "#fde68a",
    emissive: "#422006",
    roughness: 0.58,
    metalness: 0.06,
    cloudOpacity: 0.14,
    cityLight: [255, 214, 92],
    emissionStrength: 0.22,
  },
  sad: {
    base: [55, 61, 122],
    deep: [10, 14, 42],
    land: [93, 80, 170],
    cloud: [188, 201, 245],
    accent: [139, 92, 246],
    atmosphere: "#a78bfa",
    emissive: "#1e1b4b",
    roughness: 0.78,
    metalness: 0.01,
    cloudOpacity: 0.13,
    cityLight: [154, 129, 255],
    emissionStrength: 0.14,
  },
  release: {
    base: [153, 176, 176],
    deep: [56, 73, 83],
    land: [207, 222, 214],
    cloud: [248, 250, 252],
    accent: [226, 232, 240],
    atmosphere: "#e2e8f0",
    emissive: "#334155",
    roughness: 0.72,
    metalness: 0.03,
    cloudOpacity: 0.2,
    cityLight: [226, 246, 255],
    emissionStrength: 0.16,
  },
  crisis: {
    base: [88, 37, 60],
    deep: [18, 12, 25],
    land: [145, 55, 80],
    cloud: [245, 196, 205],
    accent: [251, 113, 133],
    atmosphere: "#fb7185",
    emissive: "#3f0d20",
    roughness: 0.82,
    metalness: 0.0,
    cloudOpacity: 0.1,
    cityLight: [255, 93, 123],
    emissionStrength: 0.2,
  },
  chat: {
    base: [83, 98, 169],
    deep: [20, 28, 70],
    land: [124, 116, 214],
    cloud: [226, 232, 255],
    accent: [196, 181, 253],
    atmosphere: "#c4b5fd",
    emissive: "#312e81",
    roughness: 0.64,
    metalness: 0.04,
    cloudOpacity: 0.16,
    cityLight: [190, 174, 255],
    emissionStrength: 0.2,
  },
};

function mulberry32(seed: number) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashNoise(x: number, y: number, seed: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function fbm(x: number, y: number, seed: number) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < 6; i += 1) {
    value += amplitude * hashNoise(x * frequency, y * frequency, seed + i * 19);
    frequency *= 2.05;
    amplitude *= 0.52;
  }
  return value;
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function clampColor(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function colorToCss([r, g, b]: RGB, alpha = 1) {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function paintCraters(ctx: CanvasRenderingContext2D, profile: PlanetVisualProfile, seed: number) {
  const rand = mulberry32(seed + 99);
  const count = 18 + Math.floor(rand() * 18);
  for (let i = 0; i < count; i += 1) {
    const x = rand() * SIZE;
    const y = rand() * SIZE * 0.48 + SIZE * 0.02;
    const radius = 2 + rand() * 12;
    const alpha = 0.025 + rand() * 0.055;
    const gradient = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    gradient.addColorStop(0, colorToCss(profile.deep, alpha));
    gradient.addColorStop(0.58, colorToCss(profile.deep, alpha * 0.42));
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintFaultLines(ctx: CanvasRenderingContext2D, profile: PlanetVisualProfile, seed: number) {
  const rand = mulberry32(seed + 401);
  const count = 18 + Math.floor(rand() * 16);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < count; i += 1) {
    const y = (0.12 + rand() * 0.76) * (SIZE / 2);
    const startX = rand() * SIZE;
    const length = 36 + rand() * 120;
    const drift = (rand() - 0.5) * 42;
    const alpha = 0.018 + rand() * 0.045;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.bezierCurveTo(
      startX + length * 0.32,
      y + drift,
      startX + length * 0.65,
      y - drift * 0.6,
      startX + length,
      y + drift * 0.25
    );
    ctx.strokeStyle = colorToCss(profile.accent, alpha);
    ctx.lineWidth = 0.7 + rand() * 1.6;
    ctx.stroke();
  }
  ctx.restore();
}

function makeSurfaceTexture(type: PlanetType, seed: number) {
  const profile = PROFILES[type];
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE / 2;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(canvas.width, canvas.height);
  const data = image.data;
  const rand = mulberry32(seed);
  const bandOffset = rand() * Math.PI * 2;
  const landCutoff = type === "happy" ? 0.48 : type === "sad" ? 0.55 : 0.51;

  for (let y = 0; y < canvas.height; y += 1) {
    const v = y / canvas.height;
    const lat = Math.abs(v - 0.5) * 2;
    for (let x = 0; x < canvas.width; x += 1) {
      const u = x / canvas.width;
      const continental =
        fbm(u * 6.4 + Math.sin(v * 8 + bandOffset) * 0.2, v * 3.8, seed) * 0.62 +
        fbm(u * 18.0, v * 11.0, seed + 12) * 0.26 +
        fbm(u * 42.0, v * 24.0, seed + 22) * 0.12;
      const bands = Math.sin((v * 22 + fbm(u * 3, v * 7, seed + 30) * 3.2 + bandOffset)) * 0.11;
      const rimShade = 1 - smoothstep(0.56, 1, lat) * 0.28;
      const landMask = smoothstep(landCutoff - 0.08, landCutoff + 0.07, continental + bands);
      const ice = smoothstep(0.68, 0.94, lat);
      const detail = fbm(u * 70, v * 42, seed + 7) - 0.5;
      const ridges = Math.abs(fbm(u * 28, v * 18, seed + 61) - 0.5) * 2;
      let color = mix(profile.base, profile.land, landMask);
      color = mix(color, profile.deep, smoothstep(0.1, 0.55, 1 - continental) * 0.42);
      color = mix(color, profile.cloud, ice * (type === "happy" ? 0.18 : 0.32));

      const glowBand = Math.max(0, Math.sin((u + v * 0.16 + bandOffset) * Math.PI * 5)) * 0.055;
      const accent = smoothstep(0.72, 1, continental + detail * 0.5 + ridges * 0.16) * 0.26 + glowBand;
      color = mix(color, profile.accent, accent);
      color = mix(color, profile.deep, smoothstep(0.58, 1, ridges) * 0.14);

      const idx = (y * canvas.width + x) * 4;
      data[idx] = clampColor(color[0] * rimShade + detail * 34);
      data[idx + 1] = clampColor(color[1] * rimShade + detail * 30);
      data[idx + 2] = clampColor(color[2] * rimShade + detail * 28);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  paintCraters(ctx, profile, seed);
  paintFaultLines(ctx, profile, seed);

  const terminator = ctx.createLinearGradient(0, 0, canvas.width, 0);
  terminator.addColorStop(0, "rgba(0,0,0,0.18)");
  terminator.addColorStop(0.25, "rgba(0,0,0,0)");
  terminator.addColorStop(0.72, "rgba(255,255,255,0.055)");
  terminator.addColorStop(1, "rgba(0,0,0,0.24)");
  ctx.fillStyle = terminator;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return canvas;
}

function makeCloudTexture(type: PlanetType, seed: number) {
  const profile = PROFILES[type];
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE / 2;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(canvas.width, canvas.height);
  const data = image.data;

  for (let y = 0; y < canvas.height; y += 1) {
    const v = y / canvas.height;
    for (let x = 0; x < canvas.width; x += 1) {
      const u = x / canvas.width;
      const stream =
        fbm(u * 8 + v * 2.8, v * 12, seed + 210) * 0.8 +
        Math.sin((v * 24 + u * 5) * Math.PI) * 0.08;
      const wisps = smoothstep(0.48, 0.86, stream);
      const idx = (y * canvas.width + x) * 4;
      data[idx] = profile.cloud[0];
      data[idx + 1] = profile.cloud[1];
      data[idx + 2] = profile.cloud[2];
      data[idx + 3] = Math.round(wisps * 255 * profile.cloudOpacity);
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

function makeEmissionTexture(type: PlanetType, seed: number) {
  const profile = PROFILES[type];
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE / 2;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(canvas.width, canvas.height);
  const data = image.data;

  for (let y = 0; y < canvas.height; y += 1) {
    const v = y / canvas.height;
    const lat = Math.abs(v - 0.5) * 2;
    for (let x = 0; x < canvas.width; x += 1) {
      const u = x / canvas.width;
      const network = fbm(u * 38, v * 20, seed + 501);
      const vein = Math.abs(fbm(u * 14 + v * 1.5, v * 9, seed + 533) - 0.5) * 2;
      const latitudeMask = 1 - smoothstep(0.58, 0.98, lat);
      const lights = smoothstep(0.82, 0.985, network) * smoothstep(0.35, 0.02, vein) * latitudeMask;
      const idx = (y * canvas.width + x) * 4;
      data[idx] = profile.cityLight[0];
      data[idx + 1] = profile.cityLight[1];
      data[idx + 2] = profile.cityLight[2];
      data[idx + 3] = Math.round(lights * 255 * profile.emissionStrength);
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

function makeBumpTexture(type: PlanetType, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE / 2;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(canvas.width, canvas.height);
  const data = image.data;

  for (let y = 0; y < canvas.height; y += 1) {
    const v = y / canvas.height;
    for (let x = 0; x < canvas.width; x += 1) {
      const u = x / canvas.width;
      const continent = fbm(u * 8, v * 5, seed + 801);
      const ridge = Math.abs(fbm(u * 36, v * 20, seed + 821) - 0.5) * 2;
      const crater = fbm(u * 92, v * 44, seed + 833);
      const height = smoothstep(0.46, 0.82, continent) * 112 + smoothstep(0.62, 1, ridge) * 78 + crater * 30;
      const value = clampColor(58 + height);
      const idx = (y * canvas.width + x) * 4;
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

function toTexture(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export function getPlanetTexture(type: PlanetType, seed: number): THREE.CanvasTexture {
  const key = `surface-${type}-${Math.abs(seed) % 10000}`;
  const cached = texCache.get(key);
  if (cached) return cached;
  const tex = toTexture(makeSurfaceTexture(type, seed));
  texCache.set(key, tex);
  return tex;
}

export function getPlanetCloudTexture(type: PlanetType, seed: number): THREE.CanvasTexture {
  const key = `cloud-${type}-${Math.abs(seed) % 10000}`;
  const cached = texCache.get(key);
  if (cached) return cached;
  const tex = toTexture(makeCloudTexture(type, seed));
  texCache.set(key, tex);
  return tex;
}

export function getPlanetEmissionTexture(type: PlanetType, seed: number): THREE.CanvasTexture {
  const key = `emission-${type}-${Math.abs(seed) % 10000}`;
  const cached = texCache.get(key);
  if (cached) return cached;
  const tex = toTexture(makeEmissionTexture(type, seed));
  texCache.set(key, tex);
  return tex;
}

export function getPlanetBumpTexture(type: PlanetType, seed: number): THREE.CanvasTexture {
  const key = `bump-${type}-${Math.abs(seed) % 10000}`;
  const cached = texCache.get(key);
  if (cached) return cached;
  const tex = toTexture(makeBumpTexture(type, seed));
  texCache.set(key, tex);
  return tex;
}

export function getPlanetVisualProfile(type: PlanetType): PlanetVisualProfile {
  return PROFILES[type];
}

export function preloadBaseTextures(): Promise<void[]> {
  return Promise.resolve([]);
}
