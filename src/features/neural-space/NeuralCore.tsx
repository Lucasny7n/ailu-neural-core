import { useRef } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { NeuralNode, NeuralNodeStatus } from "./neuralGraph";
import { statusColors } from "./statusColors";

interface NeuralCoreProps {
  node: NeuralNode;
  status: NeuralNodeStatus;
  selected: boolean;
  onSelect: () => void;
}

export function NeuralCore({ node, status, selected, onSelect }: NeuralCoreProps): JSX.Element {
  const groupRef = useRef<Group>(null);
  const color = statusColors[status];

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }
    groupRef.current.rotation.y += delta * 0.22;
    groupRef.current.rotation.x = Math.sin(Date.now() * 0.0005) * 0.08;
  });

  return (
    <group ref={groupRef} position={node.position} onClick={(event) => {
      event.stopPropagation();
      onSelect();
    }}>
      <mesh>
        <icosahedronGeometry args={[0.96, 3]} />
        <meshStandardMaterial color="#061a26" emissive={color} emissiveIntensity={0.7} roughness={0.28} metalness={0.35} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.22, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.16 : 0.09} wireframe />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.55, 0.012, 12, 120]} />
        <meshBasicMaterial color={color} transparent opacity={0.78} />
      </mesh>
      <mesh rotation={[0.25, Math.PI / 2, 0]}>
        <torusGeometry args={[1.85, 0.01, 12, 120]} />
        <meshBasicMaterial color="#198cff" transparent opacity={0.45} />
      </mesh>
      <pointLight color={color} intensity={selected ? 4.5 : 3.2} distance={8} />
      <Text
        position={[0, -1.65, 0]}
        fontSize={0.26}
        color="#f5fbff"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.2}
      >
        {node.label}
      </Text>
      <Text
        position={[0, -2.03, 0]}
        fontSize={0.16}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        READY / OLLAMA LOCAL
      </Text>
    </group>
  );
}
