import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Starfield from "./Starfield";
import CenterCore from "./CenterCore";
import EmotionPlanet from "./EmotionPlanet";
import { useUniverseStore } from "../../stores/useUniverseStore";

function Scene() {
  const planets = useUniverseStore((s) => s.planets);
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#fde68a" distance={40} />
      <Starfield />
      <CenterCore />
      {planets.map((p) => (
        <EmotionPlanet key={p.id} planet={p} />
      ))}
    </>
  );
}

export default function UniverseCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 10, 22], fov: 50 }}
      style={{ position: "absolute", inset: 0, background: "#020617" }}
      gl={{ antialias: true }}
      onPointerMissed={() => useUniverseStore.getState().selectPlanet(null)}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI * 0.7}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
