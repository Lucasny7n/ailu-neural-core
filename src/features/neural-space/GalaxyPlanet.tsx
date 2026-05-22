import { useMemo, useRef, useState } from "react";
import { Line, Text } from "@react-three/drei";
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
      groupRef.current.position.set(
        parent.position[0] + Math.cos(angle) * object.orbitRadius,
        basePosition.y + Math.sin(angle * 1.8) * 0.16,
        parent.position[2] + Math.sin(angle) * object.orbitRadius,
      );
    }
    const pulse = Math.sin(state.clock.elapsedTime * 1.6 + seed) * 0.025;
    groupRef.current.scale.setScalar((active ? 1.16 : 1) + pulse);
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
      <pointLight color={color} intensity={active ? 1.3 : 0.44} distance={3.4} />
      <Text position={[0, -0.56, 0]} fontSize={0.085} color={dimmed ? "#687d91" : "#dff7ff"} anchorX="center" anchorY="middle" maxWidth={1.4}>
        {object.label}
      </Text>
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
  const opacity = dimmed ? 0.2 : active ? 0.95 : 0.68;
  if (object.kind === "memory-note" || object.kind === "memory-file") {
    return (
      <group>
        <mesh rotation={[0.3, 0.2, 0]}>
          <octahedronGeometry args={[object.kind === "memory-file" ? 0.32 : 0.26, 1]} />
          <meshStandardMaterial color="#08020e" emissive={color} emissiveIntensity={active ? 1.2 : 0.65} transparent opacity={opacity} />
        </mesh>
        <Line
          points={[new Vector3(-0.45, 0.05, 0), new Vector3(-0.1, 0.35, 0.05), new Vector3(0.4, -0.03, -0.05), new Vector3(0.08, -0.35, 0.03)]}
          color={color}
          lineWidth={active ? 1.6 : 1.0}
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
          <cylinderGeometry args={[0.38, 0.38, 0.12, 8]} />
          <meshStandardMaterial color="#180c02" emissive={color} emissiveIntensity={active ? 1.3 : 0.72} transparent opacity={opacity} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
          <torusGeometry args={[0.52, 0.015, 8, 32]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      </group>
    );
  }

  if (object.kind === "system-component" || object.kind === "hardware-component") {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.55, 0.38, 0.16]} />
          <meshStandardMaterial color="#020812" emissive={color} emissiveIntensity={active ? 1.1 : 0.55} metalness={0.6} roughness={0.1} transparent opacity={opacity} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.72, 0.52, 0.04]} />
          <meshBasicMaterial color={color} transparent opacity={opacity * 0.25} wireframe />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.3, 32, 24]} />
        <meshStandardMaterial color="#020812" emissive={color} emissiveIntensity={active ? 1.1 : 0.5} transparent opacity={opacity} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.46, 0.01, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.8 : 0.45} />
      </mesh>
    </group>
  );
}
