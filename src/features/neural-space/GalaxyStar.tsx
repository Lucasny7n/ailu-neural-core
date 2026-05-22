import { useRef, useState } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { GalaxyObject } from "./galaxyGraph";
import { colorForGalaxyObject, statusLabelForGalaxy } from "./galaxyGraph";

interface GalaxyStarProps {
  object: GalaxyObject;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}

export function GalaxyStar({ object, selected, dimmed, onSelect }: GalaxyStarProps): JSX.Element {
  const groupRef = useRef<Group>(null);
  const ringRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const color = colorForGalaxyObject(object);
  const active = selected || hovered;
  const opacity = dimmed ? 0.28 : active ? 1 : 0.72;

  useFrame((state, delta) => {
    if (groupRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 1.4 + object.position[0]) * 0.035;
      groupRef.current.scale.setScalar((active ? 1.14 : 1) + pulse);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.16;
      ringRef.current.rotation.x += delta * 0.04;
    }
  });

  return (
    <group
      ref={groupRef}
      position={object.position}
      scale={1.15}
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
      <mesh>
        <sphereGeometry args={[0.55, 48, 32]} />
        <meshStandardMaterial color="#020812" emissive={color} emissiveIntensity={active ? 1.6 : 1.1} roughness={0.1} metalness={0.5} transparent opacity={opacity} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.95, 48, 32]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.22 : 0.1} />
      </mesh>
      <group ref={ringRef} rotation={[Math.PI / 2.5, 0.2, 0]}>
        <mesh>
          <torusGeometry args={[1.05, 0.018, 12, 120]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.85 : 0.4} />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, 0.5, 0]}>
          <torusGeometry args={[1.3, 0.012, 12, 120]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.55 : 0.25} />
        </mesh>
      </group>
      <pointLight color={color} intensity={active ? 3.5 : 1.8} distance={7.5} />
      <Text position={[0, -1.3, 0]} fontSize={0.16} color={dimmed ? "#6f8396" : "#f5fbff"} anchorX="center" anchorY="middle" maxWidth={2.2}>
        {object.label}
      </Text>
      <Text position={[0, -1.52, 0]} fontSize={0.085} color={color} anchorX="center" anchorY="middle" maxWidth={2}>
        {statusLabelForGalaxy(object).toUpperCase()}
      </Text>
    </group>
  );
}
