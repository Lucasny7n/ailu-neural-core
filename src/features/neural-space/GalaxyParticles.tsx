import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { Vector3 } from "three";
import type { GalaxyConnection, GalaxyObject } from "./galaxyGraph";
import { colorForGalaxyConnection } from "./galaxyGraph";
import { buildGalaxyCable } from "./galaxyGeometry";

interface GalaxyParticlesProps {
  connections: GalaxyConnection[];
  objects: Map<string, GalaxyObject>;
  selectedConnectionId?: string;
  reducedMotion: boolean;
  maxParticles: number;
}

export function GalaxyParticles({
  connections,
  objects,
  selectedConnectionId,
  reducedMotion,
  maxParticles,
}: GalaxyParticlesProps): JSX.Element {
  if (reducedMotion) {
    return <></>;
  }
  const limitedConnections = connections.slice(0, Math.max(24, Math.min(connections.length, Math.floor(maxParticles / 10))));
  return (
    <>
      {limitedConnections.flatMap((connection, index) => {
        const from = objects.get(connection.fromId);
        const to = objects.get(connection.toId);
        if (!from || !to) {
          return [];
        }
        const focused = selectedConnectionId === connection.id;
        const count = focused ? 5 : connection.active ? 3 : connection.strength > 0.7 ? 2 : 1;
        return Array.from({ length: count }, (_, particleIndex) => (
          <CableParticle
            key={`${connection.id}-${particleIndex}`}
            connection={connection}
            from={from}
            to={to}
            index={index + particleIndex * 13}
            focused={focused}
          />
        ));
      })}
    </>
  );
}

function CableParticle({
  connection,
  from,
  to,
  index,
  focused,
}: {
  connection: GalaxyConnection;
  from: GalaxyObject;
  to: GalaxyObject;
  index: number;
  focused: boolean;
}): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const curve = useMemo(() => buildGalaxyCable(from, to, connection.strength).curve, [connection, from, to]);
  const color = colorForGalaxyConnection(connection);

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }
    const speed = focused ? 0.74 : 0.32 + connection.strength * 0.1;
    const t = (state.clock.elapsedTime * speed + index * 0.19) % 1;
    const position = curve.getPointAt(t, new Vector3());
    meshRef.current.position.copy(position);
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[focused ? 0.08 : 0.045, 0]} />
      <meshBasicMaterial color={focused ? "#f5fbff" : color} transparent opacity={focused ? 1.0 : 0.82} />
    </mesh>
  );
}
