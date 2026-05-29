import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PlanetData } from "../../types/universe";
import { useUniverseStore } from "../../stores/useUniverseStore";
import { generatePlanetTexture } from "./planetTexture";

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

export default function EmotionPlanet({ planet }: { planet: PlanetData }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedId = useUniverseStore((s) => s.selectedPlanetId);
  const selectPlanet = useUniverseStore((s) => s.selectPlanet);
  const updateAngle = useUniverseStore((s) => s.updatePlanetAngle);
  const isSelected = selectedId === planet.id;

  const seed = useMemo(() => planet.id.charCodeAt(0) * 31 + planet.id.charCodeAt(1), [planet.id]);
  const map = useMemo(() => getTexture(planet.type, seed), [planet.type, seed]);

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
      {/* 大气光晕 — 简单半透明壳 */}
      <mesh scale={[1.4, 1.4, 1.4]}>
        <sphereGeometry args={[planet.size, 16, 16]} />
        <meshBasicMaterial
          color={planet.color}
          transparent
          opacity={planet.glowIntensity * 0.08}
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
        <sphereGeometry args={[planet.size, 48, 48]} />
        <meshStandardMaterial
          map={map}
          roughness={0.7}
          metalness={0.05}
          emissive={new THREE.Color(planet.color)}
          emissiveIntensity={isSelected ? 0.3 : planet.glowIntensity * 0.15}
        />
      </mesh>

      {/* 选中环 */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2.2, 0.3, 0]}>
          <torusGeometry args={[planet.size * 1.5, 0.03, 16, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
