import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { Vector3 } from "three";
import type { NeuralConnection, NeuralNode } from "./neuralGraph";
import { statusColors } from "./statusColors";
import { buildCablePath } from "./travelPath";

interface NeuralParticlesProps {
  connections: NeuralConnection[];
  nodes: Map<string, NeuralNode>;
  focusedConnectionId?: string;
  reducedMotion: boolean;
}

export function NeuralParticles({
  connections,
  nodes,
  focusedConnectionId,
  reducedMotion,
}: NeuralParticlesProps): JSX.Element {
  if (reducedMotion) {
    return <></>;
  }
  return (
    <>
      {connections.map((connection, index) => {
        const from = nodes.get(connection.from);
        const to = nodes.get(connection.to);
        if (!from || !to) {
          return null;
        }
        const focused = focusedConnectionId === connection.id;
        const count = focused ? 4 : connection.strength > 0.8 ? 2 : 1;
        return Array.from({ length: count }, (_, particleIndex) => (
          <ConnectionParticle
            key={`${connection.id}-${particleIndex}`}
            connection={connection}
            from={from}
            to={to}
            index={index + particleIndex * 11}
            focused={focused}
          />
        ));
      })}
    </>
  );
}

interface ConnectionParticleProps {
  connection: NeuralConnection;
  from: NeuralNode;
  to: NeuralNode;
  index: number;
  focused: boolean;
}

function ConnectionParticle({
  connection,
  from,
  to,
  index,
  focused,
}: ConnectionParticleProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const curve = useMemo(() => buildCablePath(from, to, connection.strength).curve, [connection.strength, from, to]);
  const color = statusColors[focused ? "approval" : connection.status];

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }
    const speed = focused ? 0.62 : 0.28;
    const t = (state.clock.elapsedTime * speed + index * 0.17) % 1;
    const position = curve.getPointAt(t, new Vector3());
    meshRef.current.position.copy(position);
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[focused ? 0.06 : 0.036, 0]} />
      <meshBasicMaterial color={color} transparent opacity={focused ? 0.96 : 0.72} />
    </mesh>
  );
}
