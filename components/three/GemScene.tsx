'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { GemScrollRef } from './gemScroll';

// R3F 9.x still constructs `new THREE.Clock()` internally (its event store),
// which three.js r185 deprecates with a console warning we can't fix from here.
// The env-map/PMREM passes on Windows/ANGLE also emit benign D3D X4122 shader
// precision warnings ("cannot be represented accurately in double precision").
// Both reach us through three's `warn`, so we drop only those two specific,
// out-of-our-control messages and forward everything else (incl. real shader
// errors, which three routes through `error`) through unchanged.
if (typeof window !== 'undefined') {
  const CLOCK_DEPRECATION = 'Clock: This module has been deprecated.';
  const PRECISION_WARNING = 'cannot be represented accurately in double precision';
  THREE.setConsoleFunction((level, message, ...params) => {
    if (typeof message === 'string' && message.includes(CLOCK_DEPRECATION)) return;
    if (
      level === 'warn' &&
      typeof message === 'string' &&
      message.startsWith('THREE.WebGLProgram: Program Info Log:') &&
      typeof params[0] === 'string' &&
      params[0].includes(PRECISION_WARNING)
    ) {
      return;
    }
    const fn =
      level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(message, ...params);
  });
}

// Rose-gold / icy-diamond theme accents (matched to --color-primary oklch(0.65 0.12 25)).
const GOLD = '#E2B587';
const GOLD_DARK = '#A9763F';
const DIAMOND = '#FFFFFF';

/** Bakes a soft studio reflection so metals read as polished and the diamond sparkles. */
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

/**
 * Builds a stylized round-brilliant-cut gem as an indexed BufferGeometry.
 * Table (top flat facet) -> crown -> girdle -> pavilion (point). Rendered with
 * flat shading so every facet catches the environment and glints.
 */
function buildBrilliantCut(sides = 8, R = 1): THREE.BufferGeometry {
  const top = 0.5 * R; // y of the table facet
  const rt = 0.52 * R; // table radius
  const girdle = 0; // y of the widest point
  const depth = 1.1 * R; // pavilion depth (culet tip, negative y)

  const pos: number[] = [];
  const v = (x: number, y: number, z: number) => {
    pos.push(x, y, z);
    return pos.length / 3 - 1;
  };
  const idx: number[] = [];
  const tri = (a: number, b: number, c: number) => idx.push(a, b, c);

  const cTop = v(0, top, 0);
  const tableRim: number[] = [];
  const girdleV: number[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    tableRim.push(v(rt * Math.cos(a), top, rt * Math.sin(a)));
    girdleV.push(v(R * Math.cos(a), girdle, R * Math.sin(a)));
  }
  const culet = v(0, -depth, 0);

  for (let i = 0; i < sides; i++) {
    const ni = (i + 1) % sides;
    tri(cTop, tableRim[i], tableRim[ni]); // table fan
    tri(tableRim[i], girdleV[i], girdleV[ni]); // crown
    tri(tableRim[i], girdleV[ni], tableRim[ni]);
    tri(girdleV[i], culet, girdleV[ni]); // pavilion main
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function DiamondRing({ scrollRef }: { scrollRef?: GemScrollRef }) {
  const group = useRef<THREE.Group>(null); // pointer-drag rotation (user interaction)
  const scrollGroup = useRef<THREE.Group>(null); // scroll-linked + idle rotation
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const { gl, invalidate } = useThree();
  const spinLight = useRef<THREE.PointLight>(null);
  // Accumulated idle spin (frozen while dragging so the grab feels direct) and a
  // velocity-driven "flick" boost that eases in then decays back to rest.
  const idleAngle = useRef(0);
  const boost = useRef(0);

  const diamondGeo = useMemo(() => buildBrilliantCut(8, 1), []);
  useEffect(() => () => diamondGeo.dispose(), [diamondGeo]);

  // Pointer-drag rotation. Works in "demand" mode because we call invalidate()
  // after mutating the rotation, so the canvas only renders on actual input.
  useEffect(() => {
    const el = gl.domElement;
    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current || !group.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      group.current.rotation.y += dx * 0.01;
      group.current.rotation.x = THREE.MathUtils.clamp(
        group.current.rotation.x + dy * 0.01,
        -1.2,
        1.2,
      );
      invalidate();
    };
    const onUp = () => {
      dragging.current = false;
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [gl, invalidate]);

  // Outer `group` handles pointer-drag only. The inner `scrollGroup` is posed
  // every frame from the shared scroll store: a scroll-linked rotation (so
  // scrolling spins the stone to inspect every facet), a gentle idle spin that
  // freezes while you're dragging, a tilt that opens the crown as you scroll,
  // and a velocity "flick" boost. Runs only while the render loop is active.
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    g.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    if (spinLight.current) {
      const t = state.clock.elapsedTime * 1.6;
      spinLight.current.position.set(Math.cos(t) * 3, 2.4, Math.sin(t) * 3);
    }

    const sg = scrollGroup.current;
    if (!sg) return;
    const sr = scrollRef?.current;
    const p = sr?.progress ?? 0;

    // Flick boost: ease toward the velocity target, then decay to 0.
    const targetBoost = THREE.MathUtils.clamp((sr?.velocity ?? 0) * 0.00004, -8, 8);
    boost.current += (targetBoost - boost.current) * 0.08;
    boost.current *= 0.95;
    if (sr) sr.velocity *= 0.9; // settle the store when scrolling stops

    // Idle spin accumulates only when not dragging, so the gem holds still
    // under the pointer and resumes from the same angle afterwards.
    if (!dragging.current) idleAngle.current += delta * 0.15;

    sg.rotation.y = p * Math.PI * 4 + idleAngle.current + boost.current; // ~2 turns across the section
    sg.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1 + p * 0.5;
  });

  const goldMat = (
    <meshPhysicalMaterial
      color={GOLD}
      metalness={1}
      roughness={0.16}
      clearcoat={1}
      clearcoatRoughness={0.12}
      envMapIntensity={1.3}
    />
  );

  const prongAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];

  return (
    <>
      {/* Travelling glint light — outside the rotating group so it sweeps the
          facets from a fixed orbit, producing moving sparkle. */}
      <pointLight ref={spinLight} position={[3, 2.4, 3]} intensity={0.7} color={'#ffffff'} />

      {/* Contact shadow catcher — only renders the shadow, transparent elsewhere
          so it blends with the page background. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.2, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <shadowMaterial transparent opacity={0.32} />
      </mesh>

      <group ref={group}>
        {/* Scroll-linked / idle rotation wrapper — posed each frame from the
            shared scroll store. Drag rotation lives on the parent `group`. */}
        <group ref={scrollGroup}>
        {/* Centering offset so the ring+stone spins around its visual centroid */}
        <group position={[0, -0.15, 0]} scale={0.9}>
          {/* Polished gold band */}
          <mesh castShadow receiveShadow>
            <torusGeometry args={[1, 0.16, 48, 120]} />
            {goldMat}
          </mesh>

          {/* The brilliant-cut stone, seated on top of the band */}
          <group position={[0, 1.18, 0]} scale={0.6}>
            {/* Delicate gold collet hugging the girdle */}
            <mesh castShadow>
              <torusGeometry args={[0.62, 0.035, 16, 64]} />
              <meshStandardMaterial color={GOLD_DARK} metalness={1} roughness={0.25} />
            </mesh>

            {/* Four prong claws connecting the stone to the band */}
            {prongAngles.map((a, i) => (
              <mesh key={i} position={[Math.cos(a) * 0.92, -0.28, Math.sin(a) * 0.92]} castShadow>
                <cylinderGeometry args={[0.045, 0.045, 0.62, 16]} />
                <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
              </mesh>
            ))}

            {/* The diamond */}
            <mesh geometry={diamondGeo} castShadow>
              <meshPhysicalMaterial
                color={DIAMOND}
                metalness={0}
                roughness={0.02}
                clearcoat={1}
                clearcoatRoughness={0.02}
                ior={2.42}
                reflectivity={1}
                iridescence={1}
                iridescenceIOR={1.3}
                iridescenceThicknessRange={[120, 420]}
                envMapIntensity={1.8}
                emissive={'#fff3ea'}
                emissiveIntensity={0.05}
                flatShading
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </group>
        </group>
      </group>
    </>
  );
}

type GemSceneProps = {
  frameloop?: 'always' | 'demand';
  className?: string;
  progressRef?: GemScrollRef;
};

export default function GemScene({ frameloop = 'demand', className, progressRef }: GemSceneProps) {
  return (
    <Canvas
      className={className}
      shadows="percentage"
      frameloop={frameloop}
      dpr={[1, 1.25]}
      camera={{ position: [0, 0.2, 4.6], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'pan-y' }}
    >
      <EnvLighting />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[-5, -2, -3]} intensity={0.5} color={'#E9C2B6'} />
      <DiamondRing scrollRef={progressRef} />
    </Canvas>
  );
}
