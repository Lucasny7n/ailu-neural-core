import { useMemo, useRef } from "react";
import { Line, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Vector3 } from "three";
import type { NeuralNode, NeuralNodeStatus } from "./neuralGraph";
import { statusColors, statusLabel } from "./statusColors";

interface NeuralCoreProps {
  node: NeuralNode;
  status: NeuralNodeStatus;
  selected: boolean;
  onSelect: () => void;
}

export function NeuralCore({ node, status, selected, onSelect }: NeuralCoreProps): JSX.Element {
  const groupRef = useRef<Group>(null);
  const innerRef = useRef<Group>(null);
  const ringARef = useRef<Group>(null);
  const ringBRef = useRef<Group>(null);
  const ringCRef = useRef<Group>(null);
  const color = statusColors[status];

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * (status === "thinking" ? 0.38 : 0.2);
      innerRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.45) * 0.12;
    }
    if (ringARef.current) {
      ringARef.current.rotation.z += delta * 0.16;
    }
    if (ringBRef.current) {
      ringBRef.current.rotation.x -= delta * 0.11;
      ringBRef.current.rotation.y += delta * 0.07;
    }
    if (ringCRef.current) {
      ringCRef.current.rotation.y -= delta * 0.13;
    }
  });

  return (
    <group
      ref={groupRef}
      position={node.position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <CoreSynapseField color={color} status={status} />
      <group ref={innerRef}>
        <mesh>
          <icosahedronGeometry args={[1.02, 2]} />
          <meshStandardMaterial
            color="#04121d"
            emissive={color}
            emissiveIntensity={status === "approval" ? 0.9 : 0.55}
            roughness={0.18}
            metalness={0.42}
            transparent
            opacity={0.76}
            wireframe
          />
        </mesh>
        <mesh>
          <dodecahedronGeometry args={[0.7, 1]} />
          <meshStandardMaterial
            color="#061a26"
            emissive={color}
            emissiveIntensity={status === "running" ? 1.25 : 0.72}
            roughness={0.2}
            metalness={0.56}
          />
        </mesh>
      </group>

      <mesh>
        <sphereGeometry args={[1.46, 36, 36]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.11 : 0.06} wireframe />
      </mesh>

      <group ref={ringARef} rotation={[Math.PI / 2, 0, 0]}>
        <CoreRing radius={1.76} color={color} opacity={0.82} ticks={42} />
      </group>
      <group ref={ringBRef} rotation={[0.36, Math.PI / 2, 0.1]}>
        <CoreRing radius={2.08} color="#0f8cff" opacity={0.58} ticks={36} />
      </group>
      <group ref={ringCRef} rotation={[0.22, 0.42, Math.PI / 2]}>
        <CoreRing radius={2.42} color={status === "approval" ? "#ffb84d" : "#38d5ff"} opacity={0.34} ticks={54} />
      </group>

      <CoreFilaments color={color} />
      <pointLight color={color} intensity={selected ? 5.8 : 4.2} distance={11} />
      <pointLight color="#0f8cff" position={[0.8, 0.6, -0.4]} intensity={2.4} distance={8} />

      <Text position={[0, -2.05, 0]} fontSize={0.18} color="#f5fbff" anchorX="center" anchorY="middle" maxWidth={3.4}>
        AILU NEURAL CORE
      </Text>
      <Text position={[0, -2.32, 0]} fontSize={0.105} color="#8ea4b8" anchorX="center" anchorY="middle" maxWidth={3.2}>
        LOCAL / OLLAMA / qwen2.5-coder:1.5b
      </Text>
      <Text position={[0, -2.55, 0]} fontSize={0.12} color={color} anchorX="center" anchorY="middle">
        {statusLabel(status)}
      </Text>
    </group>
  );
}

function CoreRing({
  radius,
  color,
  opacity,
  ticks,
}: {
  radius: number;
  color: string;
  opacity: number;
  ticks: number;
}): JSX.Element {
  const tickItems = useMemo(() => Array.from({ length: ticks }, (_, index) => index), [ticks]);
  return (
    <group>
      <mesh>
        <torusGeometry args={[radius, 0.012, 8, 144]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      {tickItems.map((tick) => {
        const angle = (tick / ticks) * Math.PI * 2;
        const longTick = tick % 6 === 0;
        return (
          <mesh
            key={tick}
            position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[longTick ? 0.2 : 0.09, 0.018, 0.018]} />
            <meshBasicMaterial color={color} transparent opacity={longTick ? opacity : opacity * 0.62} />
          </mesh>
        );
      })}
    </group>
  );
}

function CoreSynapseField({
  color,
  status,
}: {
  color: string;
  status: NeuralNodeStatus;
}): JSX.Element {
  const synapses = useMemo(
    () =>
      Array.from({ length: 15 }, (_, index) => {
        const a = index * 2.399;
        const y = Math.sin(index * 1.41) * 0.78;
        const radius = 0.32 + (index % 5) * 0.13;
        return new Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius);
      }),
    [],
  );
  const segments = useMemo(
    () =>
      synapses.flatMap((point, index) => {
        const next = synapses[(index * 5 + 3) % synapses.length];
        return next ? [[point, next] as [Vector3, Vector3]] : [];
      }),
    [synapses],
  );
  const opacity = status === "thinking" || status === "running" ? 0.76 : 0.44;
  return (
    <group>
      {segments.map(([from, to], index) => (
        <Line key={`synapse-${index}`} points={[from, to]} color={color} lineWidth={0.9} transparent opacity={opacity} />
      ))}
      {synapses.map((point, index) => (
        <mesh key={`synapse-point-${index}`} position={point}>
          <octahedronGeometry args={[index % 4 === 0 ? 0.07 : 0.045, 0]} />
          <meshBasicMaterial color={index % 5 === 0 ? "#f5fbff" : color} transparent opacity={0.86} />
        </mesh>
      ))}
    </group>
  );
}

function CoreFilaments({ color }: { color: string }): JSX.Element {
  const filaments = useMemo(
    () => [
      [new Vector3(-2.5, 0.55, -0.5), new Vector3(-1.25, 0.2, -0.1), new Vector3(-0.6, 0.08, 0.2)],
      [new Vector3(2.6, -0.45, 0.3), new Vector3(1.4, -0.2, 0.2), new Vector3(0.65, -0.05, -0.1)],
      [new Vector3(0.2, 2.6, 0.2), new Vector3(0.15, 1.4, -0.1), new Vector3(0.05, 0.68, 0.12)],
      [new Vector3(-0.35, -2.5, -0.2), new Vector3(-0.2, -1.35, 0.15), new Vector3(-0.05, -0.7, -0.05)],
    ],
    [],
  );
  return (
    <group>
      {filaments.map((points, index) => (
        <Line key={`core-filament-${index}`} points={points} color={color} lineWidth={1.2} transparent opacity={0.42} />
      ))}
    </group>
  );
}
