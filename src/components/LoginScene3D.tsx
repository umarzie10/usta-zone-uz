import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles, Environment, OrbitControls, Icosahedron, Torus, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function SpinningKnot() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.25;
    ref.current.rotation.y += delta * 0.35;
  });
  return (
    <mesh ref={ref} scale={1.35}>
      <torusKnotGeometry args={[1, 0.32, 220, 40]} />
      {/* @ts-ignore drei types */}
      <MeshDistortMaterial
        color="#3b82f6"
        emissive="#1d4ed8"
        emissiveIntensity={0.35}
        distort={0.35}
        speed={2.2}
        roughness={0.15}
        metalness={0.9}
      />
    </mesh>
  );
}

function FloatingBits() {
  const items = [
    { pos: [-2.6, 1.4, -1] as const, color: '#60a5fa' },
    { pos: [2.4, -1.2, -0.5] as const, color: '#22d3ee' },
    { pos: [2.1, 1.8, 0.5] as const, color: '#a78bfa' },
    { pos: [-2.2, -1.6, 0.2] as const, color: '#f472b6' },
  ];
  return (
    <>
      {items.map((it, i) => (
        <Float key={i} speed={1.6 + i * 0.2} rotationIntensity={1.4} floatIntensity={2.2}>
          <Icosahedron args={[0.35, 0]} position={it.pos as unknown as THREE.Vector3}>
            <meshStandardMaterial color={it.color} metalness={0.7} roughness={0.2} emissive={it.color} emissiveIntensity={0.25} />
          </Icosahedron>
        </Float>
      ))}
      <Float speed={1.1} rotationIntensity={1} floatIntensity={1.5}>
        <Torus args={[0.6, 0.06, 24, 80]} position={[-1.8, 0.4, 1]}>
          <meshStandardMaterial color="#93c5fd" metalness={0.9} roughness={0.15} />
        </Torus>
      </Float>
      <Float speed={0.9} rotationIntensity={0.6} floatIntensity={1.2}>
        <RoundedBox args={[0.55, 0.55, 0.55]} radius={0.12} position={[1.7, 0.1, 1.2]}>
          <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.25} emissive="#f59e0b" emissiveIntensity={0.2} />
        </RoundedBox>
      </Float>
    </>
  );
}

export default function LoginScene3D() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0b1e3f']} />
      <fog attach="fog" args={['#0b1e3f', 8, 16]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.1} color="#93c5fd" />
      <pointLight position={[-4, -3, -2]} intensity={1.2} color="#a78bfa" />
      <Suspense fallback={null}>
        <SpinningKnot />
        <FloatingBits />
        <Sparkles count={80} scale={9} size={2.4} speed={0.4} color="#bfdbfe" />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} enableRotate={false} />
    </Canvas>
  );
}
