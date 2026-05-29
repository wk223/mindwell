import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PlanetData } from "../../types/universe";
import { useUniverseStore } from "../../stores/useUniverseStore";
import { generatePlanetTexture } from "./planetTexture";

/** 纹理缓存 — 避免重复生成 */
const texCache = new Map<string, THREE.CanvasTexture>();

function getTexture(type: string, seed: number): THREE.CanvasTexture {
  const key = `${type}-${seed}`;
  if (texCache.has(key)) return texCache.get(key)!;
  const canvas = generatePlanetTexture(type as any, seed);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, tex);
  return tex;
}

/** 单颗情绪星球 — 真实纹理 + 大气层 + 公转自转 */
export default function EmotionPlanet({ planet }: { planet: PlanetData }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedId = useUniverseStore((s) => s.selectedPlanetId);
  const selectPlanet = useUniverseStore((s) => s.selectPlanet);
  const updateAngle = useUniverseStore((s) => s.updatePlanetAngle);
  const isSelected = selectedId === planet.id;

  const seed = useMemo(() => planet.id.charCodeAt(0) + planet.id.charCodeAt(1) * 31, [planet.id]);
  const map = useMemo(() => getTexture(planet.type, seed), [planet.type, seed]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // 公转
    const newAngle = planet.angle + planet.orbitSpeed * delta;
    updateAngle(planet.id, newAngle);
    groupRef.current.position.set(
      Math.cos(newAngle) * planet.orbitRadius,
      Math.sin(newAngle * 2) * planet.tilt * planet.orbitRadius,
      Math.sin(newAngle) * planet.orbitRadius
    );
    // 自转
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * planet.rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 外大气光晕 — 半透明球壳 */}
      <mesh scale={[1.45, 1.45, 1.45]}>
        <sphereGeometry args={[planet.size, 32, 32]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uColor: { value: new THREE.Color(planet.color) },
            uOpacity: { value: planet.glowIntensity * 0.12 },
          }}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vec4 worldPos = modelMatrix * vec4(position, 1.0);
              vPosition = worldPos.xyz;
              vNormal = normalize(mat3(modelMatrix) * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform vec3 uColor;
            uniform float uOpacity;
            void main() {
              vec3 viewDir = normalize(cameraPosition - vPosition);
              float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.5);
              gl_FragColor = vec4(uColor, fresnel * uOpacity);
            }
          `}
        />
      </mesh>

      {/* 内光晕 */}
      <mesh scale={[1.18, 1.18, 1.18]}>
        <sphereGeometry args={[planet.size, 32, 32]} />
        <meshBasicMaterial
          color={planet.color}
          transparent
          opacity={0.04}
          depthWrite={false}
        />
      </mesh>

      {/* 星球主体 */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); selectPlanet(isSelected ? null : planet.id); }}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[planet.size, 64, 64]} />
        <meshStandardMaterial
          map={map}
          roughness={0.75}
          metalness={0.05}
        />
      </mesh>

      {/* 选中指示环 */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2.2, 0.3, 0]}>
          <torusGeometry args={[planet.size * 1.55, 0.03, 16, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
