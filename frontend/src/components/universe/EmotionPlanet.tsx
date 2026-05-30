import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PlanetData } from "../../types/universe";
import { useUniverseStore } from "../../stores/useUniverseStore";
import {
  getPlanetBumpTexture,
  getPlanetCloudTexture,
  getPlanetEmissionTexture,
  getPlanetTexture,
  getPlanetVisualProfile,
} from "./textureFactory";

export default function EmotionPlanet({ planet }: { planet: PlanetData }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
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
  const emissionTexture = useMemo(() => getPlanetEmissionTexture(planet.type, seed), [planet.type, seed]);
  const bumpTexture = useMemo(() => getPlanetBumpTexture(planet.type, seed), [planet.type, seed]);
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
    groupRef.current.scale.lerp(
      new THREE.Vector3(
        isSelected ? 1.1 : 1,
        isSelected ? 1.1 : 1,
        isSelected ? 1.1 : 1
      ),
      0.08
    );
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); selectPlanet(isSelected ? null : planet.id); }}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[planet.size, 72, 72]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={emissionTexture}
          bumpMap={bumpTexture}
          bumpScale={isSelected ? 0.085 : 0.055}
          roughness={profile.roughness}
          metalness={profile.metalness}
          emissive={profile.emissive}
          emissiveIntensity={isSelected ? 0.72 : 0.42}
        />
      </mesh>

      {/* 贴近表面的薄云层，保留真实天体层次但不形成外围透明环 */}
      <mesh ref={cloudRef} scale={[1.012, 1.012, 1.012]}>
        <sphereGeometry args={[planet.size, 72, 72]} />
        <meshStandardMaterial
          map={cloudTexture}
          transparent
          opacity={isSelected ? 0.42 : 0.28}
          depthWrite={false}
          roughness={0.9}
          metalness={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
