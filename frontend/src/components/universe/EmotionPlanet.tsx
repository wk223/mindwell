import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PlanetData } from "../../types/universe";
import { useUniverseStore } from "../../stores/useUniverseStore";
import { getPlanetTexture, preloadBaseTextures } from "./textureFactory";

// 模块加载时预加载
preloadBaseTextures();

export default function EmotionPlanet({ planet }: { planet: PlanetData }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedId = useUniverseStore((s) => s.selectedPlanetId);
  const selectPlanet = useUniverseStore((s) => s.selectPlanet);
  const updateAngle = useUniverseStore((s) => s.updatePlanetAngle);
  const isSelected = selectedId === planet.id;

  const seed = planet.id.charCodeAt(0) * 31 + planet.id.charCodeAt(1);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(() =>
    getPlanetTexture(planet.type, seed)
  );

  // 纹理异步加载（首帧可能为 null，稍后重试）
  useEffect(() => {
    if (texture) return;
    const timer = setInterval(() => {
      const tex = getPlanetTexture(planet.type, seed);
      if (tex) { setTexture(tex); clearInterval(timer); }
    }, 300);
    return () => clearInterval(timer);
  }, [planet.type, seed, texture]);

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
      <mesh scale={[1.35, 1.35, 1.35]}>
        <sphereGeometry args={[planet.size, 24, 24]} />
        <meshBasicMaterial
          color={planet.color}
          transparent
          opacity={planet.glowIntensity * 0.1}
          depthWrite={false}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); selectPlanet(isSelected ? null : planet.id); }}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[planet.size, 48, 48]} />
        <meshStandardMaterial
          map={texture || undefined}
          roughness={0.55}
          metalness={0.02}
          color={texture ? undefined : planet.color}
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
