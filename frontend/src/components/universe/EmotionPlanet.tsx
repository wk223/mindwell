import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PlanetData } from "../../types/universe";
import { useUniverseStore } from "../../stores/useUniverseStore";

/** 单颗情绪星球 — 公转 + 自转 + 发光 + 点击 */
export default function EmotionPlanet({ planet }: { planet: PlanetData }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const selectedId = useUniverseStore((s) => s.selectedPlanetId);
  const selectPlanet = useUniverseStore((s) => s.selectPlanet);
  const updateAngle = useUniverseStore((s) => s.updatePlanetAngle);

  const isSelected = selectedId === planet.id;

  // 星球纹理（程序化梯度）
  const planetMat = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(40, 50, 5, 64, 64, 70);
    gradient.addColorStop(0, planet.color);
    gradient.addColorStop(0.5, planet.color + "cc");
    gradient.addColorStop(1, "#00000033");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, [planet.color]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // 公转
    const newAngle = planet.angle + planet.orbitSpeed * delta;
    updateAngle(planet.id, newAngle);
    const x = Math.cos(newAngle) * planet.orbitRadius;
    const z = Math.sin(newAngle) * planet.orbitRadius;
    const y = Math.sin(newAngle * 2) * planet.tilt * planet.orbitRadius;
    groupRef.current.position.set(x, y, z);
    // 自转
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * planet.rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 大气光晕 */}
      <mesh ref={glowRef} scale={[1.35, 1.35, 1.35]}>
        <sphereGeometry args={[planet.size, 32, 32]} />
        <meshBasicMaterial
          color={planet.color}
          transparent
          opacity={0.08 + planet.glowIntensity * 0.06}
          depthWrite={false}
        />
      </mesh>

      {/* 星球主体 */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          selectPlanet(isSelected ? null : planet.id);
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[planet.size, 48, 48]} />
        <meshStandardMaterial
          map={planetMat}
          roughness={0.6}
          metalness={0.1}
          emissive={new THREE.Color(planet.color)}
          emissiveIntensity={isSelected ? 0.5 : planet.glowIntensity * 0.25}
        />
      </mesh>

      {/* 选中指示环 */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[planet.size * 1.6, 0.04, 16, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
