/**
 * 星球纹理工厂 — 基于 4 张真实照片生成多种变体
 * 通过 HSL 偏移 + 对比度 + 饱和度生成看似不同的星球
 */
const BASE_PATH = "/textures";

const BASES: Record<string, string> = {
  calm:    `${BASE_PATH}/planet-blue.jpg`,
  happy:   `${BASE_PATH}/planet-gold.jpg`,
  sad:     `${BASE_PATH}/planet-dark.jpg`,
  release: `${BASE_PATH}/planet-white.jpg`,
  chat:    `${BASE_PATH}/planet-blue.jpg`,
  crisis:  `${BASE_PATH}/planet-dark.jpg`,
};

/** 每种类型的变体参数 */
interface Variant {
  hueShift: number;   // -180 ~ 180
  satMult: number;    // 0.5 ~ 1.5
  lightAdd: number;   // -30 ~ 30
  contrast: number;   // 0.8 ~ 1.4
}

// 预定义变体池 — 同类型星球各有不同外观
const VARIANT_POOL: Variant[] = [
  { hueShift: 0,   satMult: 1.0,  lightAdd: 0,   contrast: 1.0  },  // 原图
  { hueShift: 15,  satMult: 1.1,  lightAdd: 5,   contrast: 1.05 },  // 暖调
  { hueShift: -12, satMult: 0.9,  lightAdd: -8,  contrast: 1.15 },  // 冷深
  { hueShift: 25,  satMult: 1.15, lightAdd: 3,   contrast: 0.95 },  // 鲜艳
  { hueShift: -20, satMult: 0.85, lightAdd: -5,  contrast: 1.2  },  // 暗沉
  { hueShift: 8,   satMult: 0.95, lightAdd: 10,  contrast: 0.9  },  // 明亮
  { hueShift: -8,  satMult: 1.05, lightAdd: -3,  contrast: 1.1  },  // 微冷
  { hueShift: 30,  satMult: 1.2,  lightAdd: 0,   contrast: 1.0  },  // 暖金
];

const texCache = new Map<string, THREE.CanvasTexture>();

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [Math.round(hue2rgb(p, q, h + 1/3) * 255), Math.round(hue2rgb(p, q, h) * 255), Math.round(hue2rgb(p, q, h - 1/3) * 255)];
}

import * as THREE from "three";

/** 根据类型+seed 获取/生成纹理 */
export function getPlanetTexture(type: string, seed: number): THREE.CanvasTexture | null {
  const variantIdx = Math.abs(seed) % VARIANT_POOL.length;
  const key = `${type}-v${variantIdx}`;
  if (texCache.has(key)) return texCache.get(key)!;

  const baseUrl = BASES[type] || BASES.calm;
  const baseImg = preloadCache.get(baseUrl);
  if (!baseImg) return null;

  const variant = VARIANT_POOL[variantIdx];
  const canvas = document.createElement("canvas");
  canvas.width = baseImg.width;
  canvas.height = baseImg.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(baseImg, 0, 0);

  if (variant.hueShift !== 0 || variant.satMult !== 1 || variant.lightAdd !== 0 || variant.contrast !== 1) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      let [h, s, l] = rgbToHsl(d[i], d[i+1], d[i+2]);
      h = ((h + variant.hueShift) % 360 + 360) % 360;
      s = Math.min(1, Math.max(0, s * variant.satMult));
      l = Math.min(1, Math.max(0, l + variant.lightAdd / 100));
      l = 0.5 + (l - 0.5) * variant.contrast;
      l = Math.min(1, Math.max(0, l));
      const [r, g, b] = hslToRgb(h, s, l);
      d[i] = r; d[i+1] = g; d[i+2] = b;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, tex);
  return tex;
}

/** 预加载原始纹理图片 */
const preloadCache = new Map<string, HTMLImageElement>();

export function preloadBaseTextures(): Promise<void[]> {
  return Promise.all(
    Object.values(BASES).map((url) => {
      if (preloadCache.has(url)) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          preloadCache.set(url, img);
          resolve();
        };
        img.onerror = () => resolve(); // 静默失败
        img.src = url;
      });
    })
  );
}

export { BASES };
