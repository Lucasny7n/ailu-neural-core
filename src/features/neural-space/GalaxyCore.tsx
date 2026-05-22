import { useMemo, useRef, useState } from "react";
import { Line, Text, Billboard } from "@react-three/drei";
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
  const reactorRef = useRef<Group>(null);
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
    if (reactorRef.current) {
      reactorRef.current.rotation.z += delta * 0.8;
    }
  });

  return (
    <group
      ref={groupRef}
      position={object.position}
      scale={(object.displayScale ?? 1) * 1.22}
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
          <icosahedronGeometry args={[1.18, 4]} />
          <meshStandardMaterial color="#03111d" emissive={color} emissiveIntensity={active ? 1.8 : 1.05} roughness={0.1} metalness={0.85} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.65, 64, 48]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.18 : 0.1} wireframe />
        </mesh>
      </group>

      <group ref={reactorRef}>
        <TriangleShape color={color} active={active} size={0.65} />
      </group>

      {[2.2, 2.6, 3.2, 4.0].map((radius, index) => (
        <group key={radius} rotation={[Math.PI / (index + 2.2), index * 0.7, Math.PI / 2.1]}>
          <mesh>
            <torusGeometry args={[radius, index === 0 ? 0.035 : 0.018, 16, 200]} />
            <meshBasicMaterial color={index === 3 && approvalActive ? "#ffcc66" : color} transparent opacity={active ? 0.9 - index * 0.18 : 0.48 - index * 0.1} />
          </mesh>
          {index % 2 === 0 && Array.from({ length: 40 }, (_, tick) => {
            const angle = (tick / 40) * Math.PI * 2;
            return (
              <mesh key={tick} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]} rotation={[0, 0, angle]}>
                <boxGeometry args={[tick % 5 === 0 ? 0.28 : 0.1, 0.025, 0.025]} />
                <meshBasicMaterial color={color} transparent opacity={0.7} />
              </mesh>
            );
          })}
        </group>
      ))}

      {Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        const orbit = 3.25 + (index % 3) * 0.28;
        return (
          <mesh key={`orbital-node-${index}`} position={[Math.cos(angle) * orbit, Math.sin(index * 1.1) * 0.46, Math.sin(angle) * orbit]}>
            <sphereGeometry args={[index % 6 === 0 ? 0.09 : 0.055, 12, 8]} />
            <meshBasicMaterial color={index % 6 === 0 ? "#f5fbff" : color} transparent opacity={active ? 0.9 : 0.55} />
          </mesh>
        );
      })}

      <pointLight color={color} intensity={active ? 22 : 12} distance={35} />
      <pointLight color="#0f8cff" position={[2, 1.5, -1]} intensity={6} distance={20} />

      <Billboard follow lockX={false} lockY={false} lockZ={false} position={[0, -5.2, 0]}>
        <Text fontSize={0.38} color="#f5fbff" anchorX="center" anchorY="middle" maxWidth={6} outlineWidth={0.02} outlineColor="#000">
          Ailu Neural Core
        </Text>
        <Text position={[0, -0.6, 0]} fontSize={0.18} color={color} anchorX="center" anchorY="middle" maxWidth={5} outlineWidth={0.01} outlineColor="#000">
          {approvalActive ? "AGUARDANDO AUTORIZAÇÃO" : statusLabelForGalaxy(object).toUpperCase()}
        </Text>
      </Billboard>
    </group>
  );
}

function TriangleShape({ color, active, size }: { color: string; active: boolean; size: number }): JSX.Element {
  const points = useMemo(() => {
    const h = (Math.sqrt(3) / 2) * size;
    return [
      new Vector3(0, h * 0.67, 0),
      new Vector3(-size / 2, -h * 0.33, 0),
      new Vector3(size / 2, -h * 0.33, 0),
      new Vector3(0, h * 0.67, 0),
    ];
  }, [size]);

  return (
    <group position={[0, 0, 1.6]}>
      <Line points={points} color={color} lineWidth={3} transparent opacity={active ? 1 : 0.6} />
      <mesh>
        <circleGeometry args={[size * 0.28, 32]} />
        <meshBasicMaterial color="#fff" transparent opacity={active ? 0.95 : 0.5} />
      </mesh>
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
