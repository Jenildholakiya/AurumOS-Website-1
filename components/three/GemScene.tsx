'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Rose Gold theme accents (matched to --color-primary oklch(0.65 0.12 25)).
const GEM = '#C77B6B';
const GEM_LIGHT = '#E9C2B6';

/** Bakes a soft studio reflection so the metallic gem reads as polished gold. */
function EnvLighting() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    return () => {
      envTexture.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Gem() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y += delta * 0.35;
    g.rotation.x = Math.sin(t * 0.3) * 0.15;
    g.position.y = Math.sin(t * 0.8) * 0.06;
  });

  return (
    <group ref={group}>
      {/* Faceted brilliant-cut stone */}
      <mesh>
        <icosahedronGeometry args={[1.35, 0]} />
        <meshStandardMaterial color={GEM} metalness={0.95} roughness={0.18} flatShading />
      </mesh>
      {/* Inner radiant core */}
      <mesh scale={0.62}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={GEM_LIGHT}
          metalness={0.6}
          roughness={0.25}
          emissive={GEM}
          emissiveIntensity={0.12}
          flatShading
        />
      </mesh>
    </group>
  );
}

type GemSceneProps = {
  frameloop?: 'always' | 'demand';
  className?: string;
};

export default function GemScene({ frameloop = 'demand', className }: GemSceneProps) {
  return (
    <Canvas
      className={className}
      frameloop={frameloop}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <EnvLighting />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <directionalLight position={[-5, -2, -3]} intensity={0.5} color={GEM_LIGHT} />
      <Gem />
    </Canvas>
  );
}
