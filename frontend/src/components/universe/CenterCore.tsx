import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** 宇宙中心 — 发光核心，所有星球围绕它公转 */
export default function CenterCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.2;
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.1;
    if (glowRef.current) {
      const s = 1 + Math.sin(Date.now() * 0.002) * 0.05;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      {/* 内核 — 炽白光球 */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial color="#fffef0" />
      </mesh>
      {/* 光晕壳 */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshBasicMaterial
          color="#fde68a"
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>
      {/* 外光晕 */}
      <mesh>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.05}
          depthWrite={false}
        />
      </mesh>
      {/* 轨道参考环 */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.5, 0.02, 16, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} depthWrite={false} />
      </mesh>
    </group>
  );
}
