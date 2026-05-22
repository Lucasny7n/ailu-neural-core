import { useMemo, useRef, useState } from "react";
import { Line, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Vector3 } from "three";
import type { NeuralNode as NeuralNodeData, NeuralNodeStatus, NeuralNodeType } from "./neuralGraph";
import { statusColors, statusLabel } from "./statusColors";

interface NeuralNodeProps {
  node: NeuralNodeData;
  status: NeuralNodeStatus;
  selected: boolean;
  dimmed?: boolean;
  onSelect: () => void;
}

export function NeuralNode({ node, status, selected, dimmed = false, onSelect }: NeuralNodeProps): JSX.Element {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const color = statusColors[status];
  const baseScale = node.depth === 1 ? 1 : node.depth === 2 ? 0.82 : 0.66;
  const isActive = selected || hovered;

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }
    const pulse = Math.sin(state.clock.elapsedTime * 1.45 + node.position[0]) * 0.025;
    groupRef.current.scale.setScalar((isActive ? 1.12 : 1) * baseScale + pulse);
  });

  return (
    <group
      ref={groupRef}
      position={node.position}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <NodeShell type={node.type} color={color} status={status} active={isActive} dimmed={dimmed} />
      <pointLight color={color} intensity={isActive ? 1.8 : 0.52} distance={4.8} />
      <Text
        position={[0, node.depth === 1 ? -0.72 : -0.58, 0]}
        fontSize={node.depth === 1 ? 0.15 : 0.115}
        color={dimmed ? "#5f7488" : selected ? "#f5fbff" : "#b9e8f5"}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.9}
      >
        {node.label}
      </Text>
      <Text position={[0, node.depth === 1 ? -0.94 : -0.76, 0]} fontSize={0.075} color={color} anchorX="center" anchorY="middle">
        {statusLabel(status)}
      </Text>
    </group>
  );
}

function NodeShell({
  type,
  color,
  status,
  active,
  dimmed,
}: {
  type: NeuralNodeType;
  color: string;
  status: NeuralNodeStatus;
  active: boolean;
  dimmed: boolean;
}): JSX.Element {
  if (type === "hardware") {
    return <HardwarePlate color={color} active={active} dimmed={dimmed} />;
  }
  if (type === "interface") {
    return <InterfacePlate color={color} active={active} dimmed={dimmed} />;
  }
  if (type === "network" || type === "audio") {
    return <RadarNode color={color} active={active} dimmed={dimmed} />;
  }
  if (type === "ai") {
    return <AiCapsule color={color} active={active} dimmed={dimmed} />;
  }
  if (type === "memory") {
    return <MemoryConstellation color={color} active={active} dimmed={dimmed} />;
  }
  if (type === "action") {
    return <ActionNode color={status === "idle" ? "#ffb84d" : color} active={active} dimmed={dimmed} />;
  }
  return <SystemHex color={color} active={active} dimmed={dimmed} />;
}

function SystemHex({ color, active, dimmed }: VisualProps): JSX.Element {
  const opacity = dimmed ? 0.18 : active ? 0.86 : 0.52;
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.43, 0.43, 0.08, 6]} />
        <meshStandardMaterial color="#06131d" emissive={color} emissiveIntensity={active ? 0.55 : 0.26} roughness={0.22} metalness={0.45} transparent opacity={opacity} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 6]}>
        <torusGeometry args={[0.5, 0.012, 8, 6]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <MicroLines color={color} opacity={opacity} />
    </group>
  );
}

function HardwarePlate({ color, active, dimmed }: VisualProps): JSX.Element {
  const opacity = dimmed ? 0.16 : active ? 0.8 : 0.48;
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.82, 0.36, 0.08]} />
        <meshStandardMaterial color="#06131d" emissive={color} emissiveIntensity={active ? 0.5 : 0.22} metalness={0.52} roughness={0.2} transparent opacity={opacity} />
      </mesh>
      {[0, 1, 2].map((index) => (
        <mesh key={index} position={[-0.24 + index * 0.24, 0, 0.065]}>
          <boxGeometry args={[0.08, 0.28 - index * 0.045, 0.018]} />
          <meshBasicMaterial color={color} transparent opacity={opacity * 1.12} />
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[1.02, 0.52, 0.018]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.18} wireframe />
      </mesh>
    </group>
  );
}

function InterfacePlate({ color, active, dimmed }: VisualProps): JSX.Element {
  const opacity = dimmed ? 0.16 : active ? 0.78 : 0.46;
  return (
    <group>
      <mesh rotation={[0.08, -0.08, 0]}>
        <boxGeometry args={[0.9, 0.5, 0.035]} />
        <meshBasicMaterial color="#06131d" transparent opacity={opacity * 0.84} />
      </mesh>
      <mesh>
        <planeGeometry args={[0.95, 0.55, 4, 3]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.22} wireframe />
      </mesh>
      <Line points={[new Vector3(-0.42, -0.18, 0.05), new Vector3(0.42, -0.18, 0.05)]} color={color} lineWidth={1} transparent opacity={opacity} />
      <Line points={[new Vector3(-0.42, 0.0, 0.05), new Vector3(0.18, 0.0, 0.05)]} color={color} lineWidth={1} transparent opacity={opacity * 0.72} />
    </group>
  );
}

function RadarNode({ color, active, dimmed }: VisualProps): JSX.Element {
  const opacity = dimmed ? 0.16 : active ? 0.86 : 0.44;
  return (
    <group>
      {[0.24, 0.4, 0.56].map((radius) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.009, 8, 72]} />
          <meshBasicMaterial color={color} transparent opacity={opacity * (0.92 - radius * 0.6)} />
        </mesh>
      ))}
      <mesh>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#06131d" emissive={color} emissiveIntensity={active ? 0.8 : 0.35} transparent opacity={opacity} />
      </mesh>
      <Line points={[new Vector3(0, 0, 0), new Vector3(0.52, 0.16, 0)]} color={color} lineWidth={1.2} transparent opacity={opacity} />
    </group>
  );
}

function AiCapsule({ color, active, dimmed }: VisualProps): JSX.Element {
  const opacity = dimmed ? 0.16 : active ? 0.84 : 0.5;
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.21, 0.46, 8, 16]} />
        <meshStandardMaterial color="#06131d" emissive={color} emissiveIntensity={active ? 0.78 : 0.36} roughness={0.16} metalness={0.4} transparent opacity={opacity} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.18, 1]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.86} wireframe />
      </mesh>
    </group>
  );
}

function MemoryConstellation({ color, active, dimmed }: VisualProps): JSX.Element {
  const opacity = dimmed ? 0.16 : active ? 0.88 : 0.48;
  const points = useMemo(
    () => [
      new Vector3(-0.32, 0.08, 0),
      new Vector3(-0.06, 0.26, 0.03),
      new Vector3(0.28, 0.12, -0.02),
      new Vector3(0.18, -0.22, 0.02),
      new Vector3(-0.24, -0.18, -0.03),
    ],
    [],
  );
  return (
    <group>
      {[0, 1, 2, 3, 4].map((index) => (
        <Line key={`mem-line-${index}`} points={[points[index], points[(index + 2) % points.length]]} color={color} lineWidth={0.9} transparent opacity={opacity * 0.72} />
      ))}
      {points.map((point, index) => (
        <mesh key={`mem-point-${index}`} position={point}>
          <octahedronGeometry args={[0.06, 0]} />
          <meshBasicMaterial color={index === 0 ? "#f5fbff" : color} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
}

function ActionNode({ color, active, dimmed }: VisualProps): JSX.Element {
  const opacity = dimmed ? 0.18 : active ? 0.92 : 0.58;
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.46, 0.46, 0.08, 8]} />
        <meshStandardMaterial color="#1e1304" emissive={color} emissiveIntensity={active ? 0.8 : 0.38} roughness={0.22} metalness={0.34} transparent opacity={opacity} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
        <torusGeometry args={[0.58, 0.014, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <Line points={[new Vector3(-0.34, 0, 0.08), new Vector3(0.34, 0, 0.08)]} color={color} lineWidth={1.4} transparent opacity={opacity} />
    </group>
  );
}

function MicroLines({ color, opacity }: { color: string; opacity: number }): JSX.Element {
  return (
    <group>
      <Line points={[new Vector3(-0.28, -0.1, 0.08), new Vector3(0.22, -0.1, 0.08)]} color={color} lineWidth={0.8} transparent opacity={opacity} />
      <Line points={[new Vector3(-0.18, 0.08, 0.08), new Vector3(0.32, 0.08, 0.08)]} color={color} lineWidth={0.8} transparent opacity={opacity * 0.72} />
    </group>
  );
}

interface VisualProps {
  color: string;
  active: boolean;
  dimmed: boolean;
}
