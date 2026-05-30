import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PlanetData } from "../../types/universe";
import { useUniverseStore } from "../../stores/useUniverseStore";
import {
  getPlanetCloudTexture,
  getPlanetTexture,
  getPlanetVisualProfile,
} from "./textureFactory";

export default function EmotionPlanet({ planet }: { planet: PlanetData }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const selectedId = useUniverseStore((s) => s.selectedPlanetId);
  const selectPlanet = useUniverseStore((s) => s.selectPlanet);
  const updateAngle = useUniverseStore((s) => s.updatePlanetAngle);
  const isSelected = selectedId === planet.id;

  const seed = useMemo(() => {
    return planet.id.split("").reduce((sum, char, index) => {
      return sum + char.charCodeAt(0) * (index + 17);
    }, 97);
  }, [planet.id]);

  const texture = useMemo(() => getPlanetTexture(planet.type, seed), [planet.type, seed]);
  const cloudTexture = useMemo(() => getPlanetCloudTexture(planet.type, seed), [planet.type, seed]);
  const profile = useMemo(() => getPlanetVisualProfile(planet.type), [planet.type]);

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
    if (cloudRef.current) {
      cloudRef.current.rotation.y -= delta * planet.rotationSpeed * 0.35;
      cloudRef.current.rotation.z = Math.sin(newAngle * 0.8) * 0.03;
    }
    if (glowRef.current) {
      const pulse = isSelected ? 1.08 + Math.sin(Date.now() * 0.003) * 0.035 : 1;
      glowRef.current.scale.setScalar(pulse);
    }
    groupRef.current.scale.lerp(
      new THREE.Vector3(
        isSelected ? 1.12 : 1,
        isSelected ? 1.12 : 1,
        isSelected ? 1.12 : 1
      ),
      0.08
    );
  });

  return (
    <group ref={groupRef}>
      {/* 远距离柔光，先给星球一个情绪色的存在感 */}
      <mesh ref={glowRef} scale={[profile.glowScale, profile.glowScale, profile.glowScale]}>
        <sphereGeometry args={[planet.size * 1.34, 40, 40]} />
        <meshBasicMaterial
          color={profile.atmosphere}
          transparent
          opacity={planet.glowIntensity * (isSelected ? 0.22 : 0.12)}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); selectPlanet(isSelected ? null : planet.id); }}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[planet.size, 72, 72]} />
        <meshStandardMaterial
          map={texture}
          roughness={profile.roughness}
          metalness={profile.metalness}
          emissive={profile.emissive}
          emissiveIntensity={isSelected ? 0.12 : 0.045}
        />
      </mesh>

      {/* 半透明云层独立旋转，避免贴图球显得僵硬 */}
      <mesh ref={cloudRef} scale={[1.012, 1.012, 1.012]}>
        <sphereGeometry args={[planet.size, 72, 72]} />
        <meshStandardMaterial
          map={cloudTexture}
          transparent
          opacity={isSelected ? 0.72 : 0.54}
          depthWrite={false}
          roughness={0.9}
          metalness={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 外层大气边缘，偏写实但保留治愈光感 */}
      <mesh scale={[1.055, 1.055, 1.055]}>
        <sphereGeometry args={[planet.size, 64, 64]} />
        <meshBasicMaterial
          color={profile.atmosphere}
          transparent
          opacity={isSelected ? 0.18 : 0.09}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {isSelected && (
        <>
          <mesh rotation={[Math.PI / 2.2, 0.3, 0]}>
            <torusGeometry args={[planet.size * 1.5, 0.025, 16, 96]} />
            <meshBasicMaterial
              color={profile.atmosphere}
              transparent
              opacity={0.66}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2.05, -0.35, 0.2]}>
            <torusGeometry args={[planet.size * 1.82, 0.012, 12, 120]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.28}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
