import { useMemo, useRef, useState } from "react";
import { Line, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Vector3 } from "three";
import type { GalaxyObject } from "./galaxyGraph";
import { colorForGalaxyObject, statusLabelForGalaxy } from "./galaxyGraph";

interface GalaxyCoreProps {
  object: GalaxyObject;
  selected: boolean;
  approvalActive: boolean;
  onSelect: () => void;
}

export function GalaxyCore({ object, selected, approvalActive, onSelect }: GalaxyCoreProps): JSX.Element {
  const groupRef = useRef<Group>(null);
  const innerRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const color = approvalActive ? "#ff9f2f" : colorForGalaxyObject(object);
  const active = selected || hovered || approvalActive;

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
    if (innerRef.current) {
      innerRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.15;
      innerRef.current.rotation.y -= delta * (approvalActive ? 0.45 : 0.25);
    }
  });

  return (
    <group
      ref={groupRef}
      position={object.position}
      scale={1.25}
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
      <SynapseMesh color={color} active={active} />
      <group ref={innerRef}>
        <mesh>
          <icosahedronGeometry args={[1.4, 3]} />
          <meshStandardMaterial color="#020812" emissive={color} emissiveIntensity={active ? 1.5 : 1.1} roughness={0.1} metalness={0.7} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.9, 64, 48]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.18 : 0.1} wireframe />
        </mesh>
      </group>

      {[2.2, 2.8, 3.4].map((radius, index) => (
        <group key={radius} rotation={[Math.PI / (index + 2.5), index * 0.6, Math.PI / 2.2]}>
          <mesh>
            <torusGeometry args={[radius, index === 0 ? 0.025 : 0.015, 12, 180]} />
            <meshBasicMaterial color={index === 2 && approvalActive ? "#ffcc66" : color} transparent opacity={active ? 0.85 - index * 0.2 : 0.45 - index * 0.12} />
          </mesh>
          {Array.from({ length: 32 }, (_, tick) => {
            const angle = (tick / 32) * Math.PI * 2;
            return (
              <mesh key={tick} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]} rotation={[0, 0, angle]}>
                <boxGeometry args={[tick % 4 === 0 ? 0.22 : 0.09, 0.02, 0.02]} />
                <meshBasicMaterial color={color} transparent opacity={0.65} />
              </mesh>
            );
          })}
        </group>
      ))}

      <pointLight color={color} intensity={active ? 12 : 8} distance={18} />
      <pointLight color="#0f8cff" position={[1.5, 1.2, -0.6]} intensity={4} distance={12} />
      <Text position={[0, -3.2, 0]} fontSize={0.25} color="#f5fbff" anchorX="center" anchorY="middle" maxWidth={4}>
        Ailu Neural Core
      </Text>
      <Text position={[0, -3.6, 0]} fontSize={0.13} color={color} anchorX="center" anchorY="middle" maxWidth={3.5}>
        {approvalActive ? "AGUARDANDO AUTORIZAÇÃO DO OPERADOR" : statusLabelForGalaxy(object).toUpperCase()}
      </Text>
    </group>
  );
}

function SynapseMesh({ color, active }: { color: string; active: boolean }): JSX.Element {
  const points = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const angle = index * 2.39996;
        const radius = 0.34 + (index % 6) * 0.11;
        return new Vector3(Math.cos(angle) * radius, Math.sin(index * 1.37) * 0.8, Math.sin(angle) * radius);
      }),
    [],
  );

  return (
    <group>
      {points.map((point, index) => (
        <mesh key={`core-point-${index}`} position={point}>
          <octahedronGeometry args={[index % 5 === 0 ? 0.09 : 0.055, 0]} />
          <meshBasicMaterial color={index % 5 === 0 ? "#f5fbff" : color} transparent opacity={active ? 0.95 : 0.72} />
        </mesh>
      ))}
      {points.map((point, index) => (
        <Line
          key={`core-link-${index}`}
          points={[point, points[(index * 5 + 3) % points.length]]}
          color={color}
          lineWidth={active ? 1.15 : 0.8}
          transparent
          opacity={active ? 0.62 : 0.38}
        />
      ))}
    </group>
  );
}
