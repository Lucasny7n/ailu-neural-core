import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { useNeuralStore } from "../../store/useNeuralStore";
import { nodeById, type NeuralNode } from "./neuralGraph";
import { buildCablePath } from "./travelPath";

interface NeuralCameraRigProps {
  focusedNode: NeuralNode;
}

export function NeuralCameraRig({ focusedNode }: NeuralCameraRigProps): null {
  const camera = useThree((state) => state.camera);
  const travelState = useNeuralStore((state) => state.travelState);
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
    if (travelState) {
      const from = nodeById.get(travelState.fromNodeId);
      const to = nodeById.get(travelState.toNodeId);
      const age = performance.now() - travelState.startedAt;
      if (from && to && age < 1350) {
        const t = Math.min(age / 1350, 1);
        const { curve } = buildCablePath(from, to, 0.82);
        const point = curve.getPointAt(Math.max(0.08, Math.min(0.86, t)));
        const next = curve.getPointAt(Math.max(0.12, Math.min(0.94, t + 0.08)));
        const offset = new Vector3(0, 0.75, 1.35).multiplyScalar(1 - t * 0.32);
        camera.position.lerp(point.clone().add(offset), 0.12);
        camera.lookAt(next);
        return;
      }
    }
    if (performance.now() > animationUntil.current) {
      return;
    }
    camera.position.lerp(targetPosition, 0.075);
    camera.lookAt(...focusedNode.position);
  });

  return null;
}
