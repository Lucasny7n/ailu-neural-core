import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { GalaxyObject } from "./galaxyGraph";

interface GalaxyFocusCameraProps {
  focusedObject: GalaxyObject;
}

export function GalaxyFocusCamera({ focusedObject }: GalaxyFocusCameraProps): null {
  const camera = useThree((state) => state.camera);
  const animationUntil = useRef(0);
  const targetPosition = useMemo(() => {
    const focus = new Vector3(...focusedObject.position);
    const direction = focus.clone().length() > 0.1 ? focus.clone().normalize() : new Vector3(0.35, 0.24, 1).normalize();
    const distance = focusedObject.kind === "core" ? 9.2 : focusedObject.kind === "star" ? 5.8 : 3.9;
    return focus.add(direction.multiplyScalar(distance)).add(new Vector3(0, 0.7, 1.1));
  }, [focusedObject]);

  useEffect(() => {
    animationUntil.current = performance.now() + 1250;
  }, [focusedObject.id]);

  useFrame(() => {
    if (performance.now() > animationUntil.current) {
      return;
    }
    camera.position.lerp(targetPosition, 0.075);
    camera.lookAt(...focusedObject.position);
  });

  return null;
}
