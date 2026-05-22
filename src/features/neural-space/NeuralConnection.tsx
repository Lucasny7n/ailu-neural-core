import { useMemo, useState } from "react";
import { Line } from "@react-three/drei";
import type { NeuralConnection as NeuralConnectionData, NeuralNode } from "./neuralGraph";
import { statusColors } from "./statusColors";
import { buildCablePath } from "./travelPath";

interface NeuralConnectionProps {
  connection: NeuralConnectionData;
  from: NeuralNode;
  to: NeuralNode;
  focused: boolean;
  dimmed?: boolean;
  onTravel: () => void;
}

export function NeuralConnection({
  connection,
  from,
  to,
  focused,
  dimmed = false,
  onTravel,
}: NeuralConnectionProps): JSX.Element {
  const [hovered, setHovered] = useState(false);
  const { points, curve } = useMemo(() => buildCablePath(from, to, connection.strength), [connection.strength, from, to]);
  const active = focused || hovered;
  const color = statusColors[focused ? "approval" : connection.status];
  const opacity = dimmed ? 0.1 : active ? 0.92 : 0.36;

  return (
    <group
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(event) => {
        event.stopPropagation();
        onTravel();
      }}
    >
      <mesh>
        <tubeGeometry args={[curve, 56, active ? 0.045 : 0.027, 8, false]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.24} />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 32, 0.14, 6, false]} />
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
      </mesh>
      <Line points={points} color={color} lineWidth={active ? 3.4 : 1.8} transparent opacity={opacity} />
      <Line points={points} color="#f5fbff" lineWidth={active ? 0.7 : 0.35} transparent opacity={active ? 0.38 : 0.12} />
    </group>
  );
}
