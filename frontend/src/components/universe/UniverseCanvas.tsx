import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import Starfield from "./Starfield";
import CenterCore from "./CenterCore";
import EmotionPlanet from "./EmotionPlanet";
import { useUniverseStore } from "../../stores/useUniverseStore";

export default function UniverseCanvas() {
  const planets = useUniverseStore((s) => s.planets);

  return (
    <Canvas
      camera={{ position: [0, 8, 18], fov: 50 }}
      style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, #0a0e1f 0%, #020617 70%)" }}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={() => useUniverseStore.getState().selectPlanet(null)}
    >
      {/* 环境光 */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#fde68a" distance={30} />

      {/* 深空星场 */}
      <Starfield />

      {/* 中心 */}
      <CenterCore />

      {/* 星球群 */}
      {planets.map((p) => (
        <EmotionPlanet key={p.id} planet={p} />
      ))}

      {/* 后处理 bloom */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          intensity={0.6}
          radius={0.5}
        />
      </EffectComposer>

      {/* 镜头控制 */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={35}
        maxPolarAngle={Math.PI * 0.7}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
