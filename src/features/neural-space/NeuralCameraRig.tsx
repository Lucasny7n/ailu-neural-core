import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { NeuralNode } from "./neuralGraph";

interface NeuralCameraRigProps {
  focusedNode: NeuralNode;
}

export function NeuralCameraRig({ focusedNode }: NeuralCameraRigProps): null {
  const camera = useThree((state) => state.camera);
  const animationUntil = useRef(0);
  const targetPosition = useMemo(() => {
    const [x, y, z] = focusedNode.position;
    const direction = new Vector3(x || 0.7, y || 0.4, z || 1).normalize();
    const distance = focusedNode.depth === 0 ? 9 : 5.2;
    return new Vector3(x, y, z).add(direction.multiplyScalar(distance));
  }, [focusedNode]);

  useEffect(() => {
    animationUntil.current = performance.now() + 1100;
  }, [focusedNode.id]);

  useFrame(() => {
    if (performance.now() > animationUntil.current) {
      return;
    }
    camera.position.lerp(targetPosition, 0.075);
    camera.lookAt(...focusedNode.position);
  });

  return null;
}
