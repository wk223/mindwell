import { useRef, useEffect, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import type { PlanetData } from "../../types/universe";
import { useUniverseStore } from "../../stores/useUniverseStore";

/** 类型 → 纹理文件映射 */
const TEXTURE_MAP: Record<string, string> = {
  calm:    "/textures/planet-blue.jpg",
  happy:   "/textures/planet-gold.jpg",
  sad:     "/textures/planet-dark.jpg",
  release: "/textures/planet-white.jpg",
  chat:    "/textures/planet-blue.jpg",   // 倾诉偏蓝
};

/** 颜色变体缓存 — 同一纹理不同 hue 偏移 */
const variantCache = new Map<string, THREE.Texture>();

function getVariantTexture(baseUrl: string, seed: number): THREE.Texture | null {
  const cacheKey = `${baseUrl}-v${seed % 5}`;
  if (variantCache.has(cacheKey)) return variantCache.get(cacheKey)!;
  return null;
}

function createVariantTexture(img: HTMLImageElement, seed: number, key: string): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  // 微调色相/饱和度
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const hueShift = (seed % 20 - 10) * 3; // -30 ~ +30 度偏移
  const satMult = 0.85 + (seed % 10) * 0.03; // 0.85~1.12

  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const newH = (h + hueShift + 360) % 360;
    const newS = Math.min(1, s * satMult);
    const [r, g, b] = hslToRgb(newH, newS, l);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  ctx.putImageData(imageData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  variantCache.set(key, tex);
  return tex;
}

// HSL 转换工具
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s, l];
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [Math.round(hue2rgb(p, q, h + 1 / 3) * 255), Math.round(hue2rgb(p, q, h) * 255), Math.round(hue2rgb(p, q, h - 1 / 3) * 255)];
}

/** 预加载所有纹理 */
const preloadedTextures = new Map<string, THREE.Texture>();
function preloadTextures() {
  if (preloadedTextures.size > 0) return;
  Object.values(TEXTURE_MAP).forEach((url) => {
    if (preloadedTextures.has(url)) return;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    preloadedTextures.set(url, tex);
  });
}
preloadTextures();

export default function EmotionPlanet({ planet }: { planet: PlanetData }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedId = useUniverseStore((s) => s.selectedPlanetId);
  const selectPlanet = useUniverseStore((s) => s.selectPlanet);
  const updateAngle = useUniverseStore((s) => s.updatePlanetAngle);
  const isSelected = selectedId === planet.id;

  const url = TEXTURE_MAP[planet.type] || TEXTURE_MAP.calm;
  const seed = planet.id.charCodeAt(0) * 31 + planet.id.charCodeAt(1);
  const variantKey = `${url}-v${seed % 5}`;

  // 基础纹理
  const baseTex = preloadedTextures.get(url);
  const [variantTex, setVariantTex] = useState<THREE.Texture | null>(() =>
    getVariantTexture(url, seed)
  );

  // 异步生成颜色变体
  useEffect(() => {
    if (variantTex) return;
    if (!baseTex) return;
    const img = baseTex.source.data as HTMLImageElement;
    if (!img || !img.complete) {
      // 图片还在加载，等一帧
      const timer = setTimeout(() => {
        if (baseTex.source.data) {
          const loadedImg = baseTex.source.data as HTMLImageElement;
          if (loadedImg.complete) {
            setVariantTex(createVariantTexture(loadedImg, seed, variantKey));
          }
        }
      }, 200);
      return () => clearTimeout(timer);
    }
    setVariantTex(createVariantTexture(img, seed, variantKey));
  }, [baseTex, seed, variantKey, variantTex]);

  const finalTex = variantTex || baseTex;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const newAngle = planet.angle + planet.orbitSpeed * delta;
    updateAngle(planet.id, newAngle);
    groupRef.current.position.set(
      Math.cos(newAngle) * planet.orbitRadius,
      Math.sin(newAngle * 2.5) * planet.tilt * planet.orbitRadius,
      Math.sin(newAngle) * planet.orbitRadius
    );
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * planet.rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 大气光晕 */}
      <mesh scale={[1.35, 1.35, 1.35]}>
        <sphereGeometry args={[planet.size, 24, 24]} />
        <meshBasicMaterial
          color={planet.color}
          transparent
          opacity={planet.glowIntensity * 0.1}
          depthWrite={false}
        />
      </mesh>

      {/* 星球主体 — 真实纹理 */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); selectPlanet(isSelected ? null : planet.id); }}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[planet.size, 48, 48]} />
        <meshStandardMaterial
          map={finalTex || undefined}
          roughness={0.55}
          metalness={0.02}
        />
      </mesh>

      {isSelected && (
        <mesh rotation={[Math.PI / 2.2, 0.3, 0]}>
          <torusGeometry args={[planet.size * 1.5, 0.03, 16, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
