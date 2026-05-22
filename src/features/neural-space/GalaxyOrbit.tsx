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
    const radius = (object.orbitRadius ?? 0) * 1.6; // Scale orbit radius
    for (let index = 0; index <= 128; index += 1) {
      const angle = (index / 128) * Math.PI * 2;
      items.push(
        new Vector3(
          parent.position[0] + Math.cos(angle) * radius,
          parent.position[1] + Math.sin(angle * 1.5) * 0.4,
          parent.position[2] + Math.sin(angle) * radius,
        ),
      );
    }
    return items;
  }, [object.orbitRadius, parent.position]);

  if (!object.orbitRadius) {
    return null;
  }
  return <Line points={points} color={color} lineWidth={active ? 1.4 : 0.6} transparent opacity={active ? 0.6 : 0.22} />;
}
