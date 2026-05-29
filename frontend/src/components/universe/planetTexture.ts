/** 程序化星球纹理生成器 — 多层噪声 + 表面细节 */
const TEX_SIZE = 256;

// Simplex-like noise（简化版，用于球面纹理）
function noise2D(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 437.58) * 43758.5453;
  return n - Math.floor(n);
}

function fbm(x: number, y: number, seed: number, octaves: number = 4): number {
  let value = 0, amplitude = 0.5, frequency = 1, total = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency, seed + i);
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / total;
}

export type PlanetTextureType = "calm" | "happy" | "sad" | "release" | "chat";

interface TextureConfig {
  baseR: number; baseG: number; baseB: number;
  spotR: number; spotG: number; spotB: number;
  bands: number;     // 气态带强度
  craters: number;   // 环形山数量
  clouds: number;    // 云层覆盖
  contrast: number;  // 对比度
}

const CONFIGS: Record<PlanetTextureType, TextureConfig> = {
  calm:  { baseR: 60, baseG: 140, baseB: 200, spotR: 40, spotG: 100, spotB: 170, bands: 0.3, craters: 15,  clouds: 0.4, contrast: 1.3 },
  happy: { baseR: 220, baseG: 180, baseB: 80, spotR: 240, spotG: 200, spotB: 100, bands: 0.7, craters: 0,   clouds: 0.1, contrast: 1.1 },
  sad:   { baseR: 80, baseG: 60,  baseB: 140, spotR: 50, spotG: 40,  spotB: 100, bands: 0.1, craters: 30,  clouds: 0.6, contrast: 1.5 },
  release:{baseR: 210, baseG: 220, baseB: 230, spotR: 180, spotG: 195, spotB: 210, bands: 0.05,craters: 8,   clouds: 0.2, contrast: 0.9 },
  chat:  { baseR: 100, baseG: 100, baseB: 180, spotR: 140, spotG: 130, spotB: 200, bands: 0.4, craters: 12,  clouds: 0.3, contrast: 1.2 },
};

export function generatePlanetTexture(type: PlanetTextureType, seed: number): HTMLCanvasElement {
  const cfg = CONFIGS[type];
  const canvas = document.createElement("canvas");
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(TEX_SIZE, TEX_SIZE);
  const data = img.data;

  for (let py = 0; py < TEX_SIZE; py++) {
    // 球面UV：v从北极到南极
    const v = 1 - py / TEX_SIZE;
    const lat = (v - 0.5) * Math.PI;
    const cosLat = Math.cos(lat);

    for (let px = 0; px < TEX_SIZE; px++) {
      const u = px / TEX_SIZE;
      const lon = u * Math.PI * 2;

      // 映射到3D球面坐标
      const sx = cosLat * Math.cos(lon);
      const sy = cosLat * Math.sin(lon);
      const sz = Math.sin(lat);

      // FBM 噪声
      const n1 = fbm(sx * 4, sy * 4, seed);
      const n2 = fbm(sx * 2 + 10, sy * 2 + 10, seed + 100);
      const n3 = fbm(sx * 8, sy * 8, seed + 200);

      // 气态带（水平条纹）
      const band = Math.sin(sz * 8 + n1 * 2) * 0.5 + 0.5;
      const bandStrength = cfg.bands * (0.5 + 0.5 * Math.abs(sz));

      // 混合基底色
      let r = cfg.baseR + (cfg.spotR - cfg.baseR) * (n1 * 0.6 + n2 * 0.3 + band * bandStrength);
      let g = cfg.baseG + (cfg.spotG - cfg.baseG) * (n1 * 0.6 + n2 * 0.3 + band * bandStrength);
      let b = cfg.baseB + (cfg.spotB - cfg.baseB) * (n1 * 0.6 + n2 * 0.3 + band * bandStrength);

      // 云层（白色覆盖）
      const cloud = Math.max(0, n3 - 0.4) * cfg.clouds * 2;
      r += cloud * 60;
      g += cloud * 60;
      b += cloud * 60;

      // 环形山暗斑
      if (cfg.craters > 0) {
        for (let c = 0; c < cfg.craters; c++) {
          const cx = noise2D(c * 3.7, seed + 50, 0) * 2 - 1;
          const cy = noise2D(c * 3.7, seed + 50, 1) * 2 - 1;
          const cz = noise2D(c * 3.7, seed + 50, 2) * 2 - 1;
          const clen = Math.sqrt(cx * cx + cy * cy + cz * cz);
          const dsx = cx / clen, dsy = cy / clen, dsz = cz / clen;
          const dist = Math.sqrt((sx - dsx) ** 2 + (sy - dsy) ** 2 + (sz - dsz) ** 2);
          const craterSize = 0.08 + noise2D(c, seed + 300, 0) * 0.12;
          if (dist < craterSize) {
            const fade = 1 - dist / craterSize;
            r -= fade * 40;
            g -= fade * 40;
            b -= fade * 40;
          }
        }
      }

      // 对比度
      r = 128 + (r - 128) * cfg.contrast;
      g = 128 + (g - 128) * cfg.contrast;
      b = 128 + (b - 128) * cfg.contrast;

      // 极地淡化
      const polarFade = 1 - Math.abs(sz) * 0.3;
      r *= polarFade;
      g *= polarFade;
      b *= polarFade;

      const idx = (py * TEX_SIZE + px) * 4;
      data[idx] = Math.max(0, Math.min(255, r));
      data[idx + 1] = Math.max(0, Math.min(255, g));
      data[idx + 2] = Math.max(0, Math.min(255, b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}
