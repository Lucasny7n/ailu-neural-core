import { useMemo, useState } from "react";
import { Line } from "@react-three/drei";
import type { GalaxyConnection as GalaxyConnectionData, GalaxyObject } from "./galaxyGraph";
import { colorForGalaxyConnection } from "./galaxyGraph";
import { buildGalaxyCable } from "./galaxyGeometry";

interface GalaxyConnectionProps {
  connection: GalaxyConnectionData;
  from: GalaxyObject;
  to: GalaxyObject;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}

export function GalaxyConnection({ connection, from, to, selected, dimmed, onSelect }: GalaxyConnectionProps): JSX.Element {
  const [hovered, setHovered] = useState(false);
  const active = selected || hovered || connection.active;
  const color = colorForGalaxyConnection(connection);
  const opacity = dimmed ? 0.08 : active ? 0.88 : 0.32;
  const { curve, points } = useMemo(() => buildGalaxyCable(from, to, connection.strength), [from, to, connection.strength]);

  return (
    <group
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
      <mesh>
        <tubeGeometry args={[curve, 72, active ? 0.052 : 0.032, 8, false]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.28} />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 36, 0.16, 6, false]} />
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
      </mesh>
      <Line points={points} color={color} lineWidth={active ? 3.2 : 1.5} transparent opacity={opacity} />
      <Line points={points} color="#f5fbff" lineWidth={active ? 0.75 : 0.25} transparent opacity={active ? 0.34 : 0.1} />
    </group>
  );
}
