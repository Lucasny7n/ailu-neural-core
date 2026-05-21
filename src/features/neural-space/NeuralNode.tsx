import { useRef } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import type { NeuralNode as NeuralNodeData, NeuralNodeStatus } from "./neuralGraph";
import { statusColors } from "./statusColors";

interface NeuralNodeProps {
  node: NeuralNodeData;
  status: NeuralNodeStatus;
  selected: boolean;
  onSelect: () => void;
}

export function NeuralNode({ node, status, selected, onSelect }: NeuralNodeProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const color = statusColors[status];
  const scale = selected ? 1.18 : node.depth === 1 ? 1 : 0.78;

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }
    const pulse = Math.sin(state.clock.elapsedTime * 2.2 + node.position[0]) * 0.055;
    meshRef.current.scale.setScalar(scale + pulse);
  });

  return (
    <group
      position={node.position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[node.depth === 1 ? 0.38 : 0.28, 32, 32]} />
        <meshStandardMaterial color="#061923" emissive={color} emissiveIntensity={selected ? 1.15 : 0.58} roughness={0.25} metalness={0.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[node.depth === 1 ? 0.62 : 0.46, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.18 : 0.08} wireframe />
      </mesh>
      <pointLight color={color} intensity={selected ? 1.8 : 0.65} distance={4.5} />
      <Text
        position={[0, node.depth === 1 ? -0.75 : -0.58, 0]}
        fontSize={node.depth === 1 ? 0.18 : 0.13}
        color={selected ? "#f5fbff" : "#b9e8f5"}
        anchorX="center"
        anchorY="middle"
        maxWidth={2.1}
      >
        {node.label}
      </Text>
    </group>
  );
}
