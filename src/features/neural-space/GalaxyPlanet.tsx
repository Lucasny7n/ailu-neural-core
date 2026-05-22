import { useMemo, useRef, useState } from "react";
import { Line, Text, Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Vector3 } from "three";
import type { GalaxyObject } from "./galaxyGraph";
import { colorForGalaxyObject } from "./galaxyGraph";

interface GalaxyPlanetProps {
  object: GalaxyObject;
  parent?: GalaxyObject;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}

export function GalaxyPlanet({ object, parent, selected, dimmed, onSelect }: GalaxyPlanetProps): JSX.Element {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const color = colorForGalaxyObject(object);
  const active = selected || hovered;
  const basePosition = useMemo(() => new Vector3(...object.position), [object.position]);
  const seed = useMemo(() => object.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) * 0.013, [object.id]);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }
    if (parent && object.orbitRadius && object.orbitSpeed) {
      const angle = state.clock.elapsedTime * object.orbitSpeed + seed;
      const radius = object.orbitRadius * 1.6; // Scale orbit radius for better spacing
      groupRef.current.position.set(
        parent.position[0] + Math.cos(angle) * radius,
        basePosition.y + Math.sin(angle * 1.5) * 0.4,
        parent.position[2] + Math.sin(angle) * radius,
      );
    }
    const pulse = Math.sin(state.clock.elapsedTime * 1.8 + seed) * 0.03;
    groupRef.current.scale.setScalar((active ? 1.25 : 1) + pulse);
  });

  return (
    <group
      ref={groupRef}
      position={object.position}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <PlanetShell object={object} color={color} active={active} dimmed={dimmed} />
      <pointLight color={color} intensity={active ? 2.5 : 0.8} distance={6} />
      
      <Billboard follow lockX={false} lockY={false} lockZ={false} position={[0, -0.85, 0]}>
        <Text fontSize={0.14} color={dimmed ? "#687d91" : "#dff7ff"} anchorX="center" anchorY="middle" maxWidth={1.8} outlineWidth={0.01} outlineColor="#000">
          {object.label}
        </Text>
      </Billboard>
    </group>
  );
}

function PlanetShell({
  object,
  color,
  active,
  dimmed,
}: {
  object: GalaxyObject;
  color: string;
  active: boolean;
  dimmed: boolean;
}): JSX.Element {
  const opacity = dimmed ? 0.2 : active ? 1 : 0.75;
  if (object.kind === "memory-note" || object.kind === "memory-file") {
    return (
      <group>
        <mesh rotation={[0.3, 0.2, 0]}>
          <octahedronGeometry args={[object.kind === "memory-file" ? 0.38 : 0.32, 1]} />
          <meshStandardMaterial color="#000206" emissive={color} emissiveIntensity={active ? 2.2 : 1.2} transparent opacity={opacity} />
        </mesh>
        <Line
          points={[new Vector3(-0.55, 0.06, 0), new Vector3(-0.15, 0.45, 0.05), new Vector3(0.5, -0.04, -0.05), new Vector3(0.1, -0.45, 0.03)]}
          color={color}
          lineWidth={active ? 2.2 : 1.2}
          transparent
          opacity={opacity}
        />
      </group>
    );
  }

  if (object.kind === "action") {
    return (
      <group>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.45, 0.45, 0.15, 8]} />
          <meshStandardMaterial color="#0a0501" emissive={color} emissiveIntensity={active ? 2.4 : 1.3} transparent opacity={opacity} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
          <torusGeometry args={[0.62, 0.018, 12, 48]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      </group>
    );
  }

  if (object.kind === "system-component" || object.kind === "hardware-component") {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.65, 0.45, 0.2]} />
          <meshStandardMaterial color="#000206" emissive={color} emissiveIntensity={active ? 1.8 : 0.85} metalness={0.9} roughness={0.05} transparent opacity={opacity} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.85, 0.6, 0.05]} />
          <meshBasicMaterial color={color} transparent opacity={opacity * 0.35} wireframe />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.35, 32, 24]} />
        <meshStandardMaterial color="#000206" emissive={color} emissiveIntensity={active ? 1.8 : 0.8} transparent opacity={opacity} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.012, 12, 80]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.95 : 0.55} />
      </mesh>
    </group>
  );
}
