import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import type { GalaxyObject } from "./galaxyGraph";

interface GalaxyFocusCameraProps {
  focusedObject: GalaxyObject;
}

export function GalaxyFocusCamera({ focusedObject }: GalaxyFocusCameraProps): null {
  const animationUntil = useRef(0);
  const targetPosition = useMemo(() => {
    const focus = new Vector3(...focusedObject.position);
    const direction = focus.clone().length() > 0.1 ? focus.clone().normalize() : new Vector3(0.4, 0.3, 1).normalize();
    const distance = focusedObject.kind === "core" ? 32 : focusedObject.kind === "star" ? 15 : 8;
    return focus.add(direction.multiplyScalar(distance)).add(new Vector3(0, distance * 0.12, distance * 0.15));
  }, [focusedObject]);

  useEffect(() => {
    animationUntil.current = performance.now() + 1500;
  }, [focusedObject.id]);

  useFrame((state) => {
    if (performance.now() > animationUntil.current) {
      return;
    }
    state.camera.position.lerp(targetPosition, 0.065);
    state.camera.lookAt(...focusedObject.position);
  });

  return null;
}
