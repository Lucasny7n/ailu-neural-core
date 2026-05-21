import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Vector3 } from "three";
import type { NeuralConnection, NeuralNode } from "./neuralGraph";
import { statusColors } from "./statusColors";

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
        return (
          <ConnectionParticle
            key={connection.id}
            connection={connection}
            from={from}
            to={to}
            index={index}
            focused={focusedConnectionId === connection.id}
          />
        );
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
  const start = useMemo(() => new Vector3(...from.position), [from.position]);
  const end = useMemo(() => new Vector3(...to.position), [to.position]);
  const color = statusColors[focused ? "approval" : connection.status];

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }
    const speed = focused ? 0.62 : 0.28;
    const t = (state.clock.elapsedTime * speed + index * 0.17) % 1;
    const position = new Vector3().lerpVectors(start, end, t);
    position.y += Math.sin(t * Math.PI) * (0.35 + connection.strength * 0.3);
    meshRef.current.position.copy(position);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[focused ? 0.055 : 0.035, 12, 12]} />
      <meshBasicMaterial color={color} transparent opacity={focused ? 0.96 : 0.72} />
    </mesh>
  );
}
