import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Environment, RoundedBox, Torus, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

/** A metal gear: torus body + teeth around the rim */
function Gear({
  position = [0, 0, 0] as [number, number, number],
  radius = 1,
  teeth = 12,
  color = '#8fb3e0',
  speed = 0.6,
  dir = 1,
}) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed * dir;
  });
  const toothArr = Array.from({ length: teeth });
  return (
    <group ref={ref} position={position}>
      <Torus args={[radius, radius * 0.26, 20, 48]}>
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.25} />
      </Torus>
      {/* hub */}
      <Cylinder args={[radius * 0.3, radius * 0.3, radius * 0.42, 24]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#3b6fb5" metalness={0.8} roughness={0.3} />
      </Cylinder>
      {toothArr.map((_, i) => {
        const a = (i / teeth) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * radius * 1.18, Math.sin(a) * radius * 1.18, 0]}
            rotation={[0, 0, a]}
          >
            <boxGeometry args={[radius * 0.34, radius * 0.24, radius * 0.5]} />
            <meshStandardMaterial color={color} metalness={0.95} roughness={0.22} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Simplified wrench: handle + open jaw */
function Wrench({ position = [0, 0, 0] as [number, number, number], scale = 1 }) {
  return (
    <group position={position} scale={scale} rotation={[0, 0, Math.PI / 5]}>
      <RoundedBox args={[0.22, 1.9, 0.16]} radius={0.07}>
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </RoundedBox>
      {[1, -1].map((s) => (
        <group key={s} position={[0, s * 1.05, 0]}>
          <Torus args={[0.32, 0.1, 12, 28]}>
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.18} />
          </Torus>
          <mesh position={[0, s * 0.34, 0]}>
            <boxGeometry args={[0.26, 0.24, 0.24]} />
            <meshStandardMaterial color="#0b1e3f" metalness={0.4} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Screwdriver */
function Screwdriver({ position = [0, 0, 0] as [number, number, number], scale = 1 }) {
  return (
    <group position={position} scale={scale} rotation={[0, 0, -Math.PI / 6]}>
      <Cylinder args={[0.17, 0.2, 0.85, 18]} position={[0, 0.55, 0]}>
        <meshStandardMaterial color="#f59e0b" metalness={0.3} roughness={0.5} />
      </Cylinder>
      <Cylinder args={[0.055, 0.055, 0.95, 14]} position={[0, -0.2, 0]}>
        <meshStandardMaterial color="#e5e7eb" metalness={0.95} roughness={0.15} />
      </Cylinder>
      <mesh position={[0, -0.72, 0]}>
        <boxGeometry args={[0.13, 0.14, 0.04]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

/** Toolbox */
function Toolbox({ position = [0, 0, 0] as [number, number, number], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[1.5, 0.85, 0.9]} radius={0.1}>
        <meshStandardMaterial color="#2563eb" metalness={0.5} roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[1.55, 0.16, 0.95]} radius={0.06} position={[0, 0.46, 0]}>
        <meshStandardMaterial color="#1e40af" metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <Torus args={[0.28, 0.055, 10, 26]} position={[0, 0.68, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </Torus>
    </group>
  );
}

/** Hard hat — safety symbol */
function HardHat({ position = [0, 0, 0] as [number, number, number], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.35} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <Torus args={[0.6, 0.07, 10, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#f59e0b" metalness={0.35} roughness={0.4} />
      </Torus>
    </group>
  );
}

function Bolts() {
  const items: { p: [number, number, number]; c: string }[] = [
    { p: [-2.9, 1.7, -1], c: '#94a3b8' },
    { p: [2.8, -1.5, -0.6], c: '#cbd5e1' },
    { p: [2.5, 2.0, 0.4], c: '#93c5fd' },
    { p: [-2.5, -1.8, 0.3], c: '#e2e8f0' },
  ];
  return (
    <>
      {items.map((it, i) => (
        <Float key={i} speed={1.4 + i * 0.2} rotationIntensity={1.6} floatIntensity={1.8}>
          <Cylinder args={[0.2, 0.2, 0.16, 6]} position={it.p}>
            <meshStandardMaterial color={it.c} metalness={0.95} roughness={0.2} />
          </Cylinder>
        </Float>
      ))}
    </>
  );
}

export default function LoginScene3D() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 7], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0b1e3f']} />
      <fog attach="fog" args={['#0b1e3f', 9, 18]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#dbeafe" />
      <pointLight position={[-4, -3, -2]} intensity={1.1} color="#60a5fa" />
      <Suspense fallback={null}>
        {/* interlocking gears — the craft engine */}
        <Gear position={[-0.9, 0.5, 0]} radius={1.1} teeth={14} speed={0.5} dir={1} color="#9db8dd" />
        <Gear position={[1.35, -0.45, -0.3]} radius={0.75} teeth={10} speed={0.75} dir={-1} color="#7f9fd0" />
        <Gear position={[0.75, 1.55, -0.8]} radius={0.5} teeth={8} speed={1.0} dir={-1} color="#bcd0ec" />

        <Float speed={1.3} rotationIntensity={0.7} floatIntensity={1.4}>
          <Wrench position={[-2.5, -0.6, 1]} scale={0.85} />
        </Float>
        <Float speed={1.1} rotationIntensity={0.6} floatIntensity={1.2}>
          <Screwdriver position={[2.5, 1.1, 0.9]} scale={0.9} />
        </Float>
        <Float speed={0.9} rotationIntensity={0.4} floatIntensity={1}>
          <Toolbox position={[1.9, -1.9, 1]} scale={0.7} />
        </Float>
        <Float speed={1.0} rotationIntensity={0.5} floatIntensity={1.2}>
          <HardHat position={[-2.2, 1.9, 0.6]} scale={0.85} />
        </Float>

        <Bolts />
        <Sparkles count={60} scale={10} size={2.2} speed={0.35} color="#bfdbfe" />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}
