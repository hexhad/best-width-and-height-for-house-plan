import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { fmtFtIn } from "../lib/wasthu.js";
import { useT } from "../hooks/useLang.js";

// Scene units are feet. Wall height and eave overhang follow a typical single-storey Sri Lankan house.
const WALL_H = 10;
const PLINTH_H = 1.5;
const EAVE = 2;
const PITCH = Math.tan(THREE.MathUtils.degToRad(32));

const PALETTE = {
  light: { wall: "#f2f3f2", plinth: "#c9ced2", roof: "#b9502a", door: "#4a3a30", ground: "#dfe4e8", label: "light" },
  dark: { wall: "#d9dcde", plinth: "#5d656c", roof: "#c45c33", door: "#2e2520", ground: "#1b2024", label: "dark" },
};

/** Writes a hipped roof over a half-length a, half-width b (b <= a) into `pos`, ridge along x. */
function writeHip(pos, a, b) {
  const h = b * PITCH;
  const r = a - b;
  const p = {
    c0: [-a, 0, -b],
    c1: [a, 0, -b],
    c2: [a, 0, b],
    c3: [-a, 0, b],
    r0: [-r, h, 0],
    r1: [r, h, 0],
  };
  const order = ["c0", "r0", "r1", "c0", "r1", "c1", "c2", "r1", "r0", "c2", "r0", "c3", "c1", "r1", "c2", "c3", "r0", "c0"];
  order.forEach((k, i) => pos.set(p[k], i * 3));
}

function House({ length, width, colors, reduce }) {
  // Long side always runs along x so the ridge follows it.
  const L = Math.max(length, width) / 12;
  const W = Math.min(length, width) / 12;
  const size = useRef({ L, W });
  const parts = useRef({});
  const [roofPositions] = useState(() => new Float32Array(18 * 3));

  useFrame((_, dt) => {
    const s = size.current;
    const k = reduce ? 1 : 1 - Math.exp(-dt * 7);
    const roofGeo = parts.current.roof?.geometry;
    // A new geometry (first frame, or after a hot reload) has to be written once even at rest.
    const fresh = roofGeo && parts.current.written !== roofGeo;
    const moving = Math.abs(L - s.L) + Math.abs(W - s.W) > 0.001 || fresh;
    if (!moving) return;
    s.L += (L - s.L) * k;
    s.W += (W - s.W) * k;
    const { plinth, walls, door } = parts.current;
    if (!plinth || !roofGeo) return;
    plinth.scale.set(s.L + 1, PLINTH_H, s.W + 1);
    walls.scale.set(s.L, WALL_H, s.W);
    door.position.set(0, PLINTH_H + 3.5, s.W / 2 + 0.06);
    const attr = roofGeo.getAttribute("position");
    writeHip(attr.array, s.L / 2 + EAVE, s.W / 2 + EAVE);
    attr.needsUpdate = true;
    roofGeo.computeVertexNormals();
    roofGeo.computeBoundingSphere();
    parts.current.written = roofGeo;
  });

  return (
    <group>
      <mesh ref={(m) => (parts.current.plinth = m)} position={[0, PLINTH_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={colors.plinth} roughness={0.9} />
      </mesh>
      <mesh ref={(m) => (parts.current.walls = m)} position={[0, PLINTH_H + WALL_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={colors.wall} roughness={0.85} />
      </mesh>
      <mesh ref={(m) => (parts.current.door = m)}>
        <boxGeometry args={[3, 7, 0.1]} />
        <meshStandardMaterial color={colors.door} roughness={0.7} />
      </mesh>
      <mesh ref={(m) => (parts.current.roof = m)} position={[0, PLINTH_H + WALL_H, 0]} castShadow>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[roofPositions, 3]} />
        </bufferGeometry>
        <meshStandardMaterial color={colors.roof} roughness={0.75} side={THREE.DoubleSide} flatShading />
      </mesh>
    </group>
  );
}

/**
 * Projects the two dimension anchors to screen space each frame and moves the
 * overlay labels there. Plain DOM outside the canvas, so no extra React roots.
 */
function Labels({ length, width, refs }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useRef(new THREE.Vector3());
  useFrame(() => {
    const L = Math.max(length, width) / 12;
    const W = Math.min(length, width) / 12;
    const anchors = [
      [0, 0.2, W / 2 + 3.2],
      [L / 2 + 3.2, 0.2, 0],
    ];
    anchors.forEach((p, i) => {
      const el = refs[i].current;
      if (!el) return;
      v.current.set(...p).project(camera);
      const x = ((v.current.x + 1) / 2) * size.width;
      const y = ((1 - v.current.y) / 2) * size.height;
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      el.style.opacity = v.current.z < 1 ? "1" : "0";
    });
  });
  return null;
}

const VIEW_DIR = new THREE.Vector3(52, 42, 60).normalize();
const frameDistance = (length, width) => (Math.hypot(length, width) / 12) * 2.1 + 24;

/**
 * Eases the camera to a distance that frames the house whenever the plan changes,
 * keeping the angle the user orbited to. Between changes, zoom is the user's.
 */
function FitCamera({ length, width }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const goal = useRef(null);

  // Narrow panels need more distance: the horizontal field of view is what crops.
  useEffect(() => {
    if (!(aspect > 0)) return; // the canvas measures 0 × 0 before its first layout
    goal.current = frameDistance(length, width) * Math.max(1, 1.15 / aspect);
  }, [length, width, aspect]);

  useFrame((_, dt) => {
    if (goal.current == null) return;
    const target = new THREE.Vector3(0, 5, 0);
    const offset = camera.position.clone().sub(target);
    const d = offset.length();
    const next = d + (goal.current - d) * (1 - Math.exp(-dt * 5));
    if (Math.abs(goal.current - next) < 0.05) goal.current = null;
    camera.position.copy(target.add(offset.setLength(next)));
    controls?.update();
  });
  return null;
}

/**
 * The selected plan as a small 3D house: plinth, walls, door and a hipped roof
 * whose ridge runs along the long side. Sizes ease between selections.
 */
export default function HouseScene({ length, width, theme, reduce }) {
  const colors = PALETTE[theme];
  const t = useT();
  const longRef = useRef(null);
  const shortRef = useRef(null);
  const longIsLength = length >= width;
  // Start already framed; FitCamera takes over when the plan changes.
  const [initialPosition] = useState(() =>
    VIEW_DIR.clone()
      .multiplyScalar(frameDistance(length, width))
      .add(new THREE.Vector3(0, 5, 0))
      .toArray(),
  );
  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: initialPosition, fov: 30, near: 1, far: 400 }}
        gl={{ antialias: true, alpha: true }}
      >
        <hemisphereLight args={["#ffffff", colors.ground, theme === "dark" ? 0.9 : 1.4]} />
        <directionalLight
          position={[30, 50, 20]}
          intensity={theme === "dark" ? 1.6 : 2.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.04}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        <FitCamera length={length} width={width} />
        <Labels length={length} width={width} refs={[longRef, shortRef]} />
        <House length={length} width={width} colors={colors} reduce={reduce} />
        <ContactShadows position={[0, 0, 0]} scale={120} blur={2.4} opacity={theme === "dark" ? 0.6 : 0.35} far={20} />
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          minDistance={35}
          maxDistance={160}
          minPolarAngle={0.35}
          maxPolarAngle={1.35}
          autoRotate={!reduce}
          autoRotateSpeed={0.6}
          target={[0, 5, 0]}
        />
      </Canvas>
      <span ref={longRef} className={`scene-label ${colors.label}`}>
        {longIsLength ? t.length : t.width} {fmtFtIn(Math.max(length, width))}
      </span>
      <span ref={shortRef} className={`scene-label ${colors.label}`}>
        {longIsLength ? t.width : t.length} {fmtFtIn(Math.min(length, width))}
      </span>
    </>
  );
}
