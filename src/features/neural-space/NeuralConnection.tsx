import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { Vector3 } from "three";
import type { NeuralConnection as NeuralConnectionData, NeuralNode } from "./neuralGraph";
import { statusColors } from "./statusColors";

interface NeuralConnectionProps {
  connection: NeuralConnectionData;
  from: NeuralNode;
  to: NeuralNode;
  focused: boolean;
  onTravel: () => void;
}

export function NeuralConnection({
  connection,
  from,
  to,
  focused,
  onTravel,
}: NeuralConnectionProps): JSX.Element {
  const points = useMemo(() => {
    const start = new Vector3(...from.position);
    const end = new Vector3(...to.position);
    const middle = start.clone().lerp(end, 0.5);
    middle.y += 0.35 + connection.strength * 0.35;
    return [start, middle, end];
  }, [connection.strength, from.position, to.position]);
  const color = statusColors[focused ? "approval" : connection.status];

  return (
    <Line
      points={points}
      color={color}
      lineWidth={focused ? 2.2 : 1.1}
      transparent
      opacity={focused ? 0.95 : 0.48}
      onClick={(event) => {
        event.stopPropagation();
        onTravel();
      }}
    />
  );
}
