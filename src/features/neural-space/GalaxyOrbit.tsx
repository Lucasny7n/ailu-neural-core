import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { Vector3 } from "three";
import type { GalaxyObject } from "./galaxyGraph";
import { colorForGalaxyObject } from "./galaxyGraph";

interface GalaxyOrbitProps {
  object: GalaxyObject;
  parent: GalaxyObject;
  active: boolean;
}

export function GalaxyOrbit({ object, parent, active }: GalaxyOrbitProps): JSX.Element | null {
  const color = colorForGalaxyObject(object);
  const points = useMemo(() => {
    const items: Vector3[] = [];
    const radius = object.orbitRadius ?? 0;
    for (let index = 0; index <= 96; index += 1) {
      const angle = (index / 96) * Math.PI * 2;
      items.push(
        new Vector3(
          parent.position[0] + Math.cos(angle) * radius,
          parent.position[1] + Math.sin(angle * 2) * 0.08,
          parent.position[2] + Math.sin(angle) * radius,
        ),
      );
    }
    return items;
  }, [object, parent.position]);

  if (!object.orbitRadius) {
    return null;
  }
  return <Line points={points} color={color} lineWidth={active ? 0.9 : 0.42} transparent opacity={active ? 0.5 : 0.16} />;
}
