import { useRef, useState } from "react";
import { Text, Billboard } from "@react-three/drei";
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
  const opacity = dimmed ? 0.28 : active ? 1 : 0.85;

  useFrame((state, delta) => {
    if (groupRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 1.4 + object.position[0]) * 0.04;
      groupRef.current.scale.setScalar((active ? 1.25 : 1) + pulse);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.2;
      ringRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <group
      ref={groupRef}
      position={object.position}
      scale={1.4}
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
        <meshStandardMaterial color="#000206" emissive={color} emissiveIntensity={active ? 2.5 : 1.6} roughness={0.05} metalness={0.8} transparent opacity={opacity} />
      </mesh>
      
      <mesh scale={1.8}>
        <sphereGeometry args={[0.42, 32, 24]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.28 : 0.12} />
      </mesh>

      <group ref={ringRef} rotation={[Math.PI / 2.5, 0.2, 0]}>
        <mesh>
          <torusGeometry args={[1.05, 0.02, 16, 140]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.95 : 0.45} />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, 0.6, 0]}>
          <torusGeometry args={[1.4, 0.012, 12, 120]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.65 : 0.28} />
        </mesh>
      </group>

      <pointLight color={color} intensity={active ? 6.5 : 3.5} distance={12} />

      <Billboard follow lockX={false} lockY={false} lockZ={false} position={[0, -1.8, 0]}>
        <Text fontSize={0.24} color={dimmed ? "#6f8396" : "#f5fbff"} anchorX="center" anchorY="middle" maxWidth={4} outlineWidth={0.015} outlineColor="#000">
          {object.label}
        </Text>
        <Text position={[0, -0.3, 0]} fontSize={0.12} color={color} anchorX="center" anchorY="middle" maxWidth={3} outlineWidth={0.008} outlineColor="#000">
          {statusLabelForGalaxy(object).toUpperCase()}
        </Text>
      </Billboard>
    </group>
  );
}
