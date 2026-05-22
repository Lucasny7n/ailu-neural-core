import { CatmullRomCurve3, Vector3 } from "three";
import type { NeuralNode } from "./neuralGraph";

export function buildCablePath(
  from: NeuralNode,
  to: NeuralNode,
  strength: number,
): { points: Vector3[]; curve: CatmullRomCurve3 } {
  const start = new Vector3(...from.position);
  const end = new Vector3(...to.position);
  const mid = start.clone().lerp(end, 0.5);
  const direction = end.clone().sub(start).normalize();
  const side = new Vector3(-direction.z, 0.35, direction.x).normalize();
  const lift = 0.5 + strength * 0.72 + Math.min(to.depth, 3) * 0.08;
  const p1 = start.clone().lerp(end, 0.28).add(side.clone().multiplyScalar(lift));
  const p2 = start.clone().lerp(end, 0.72).add(side.clone().multiplyScalar(lift * 0.55));
  mid.y += lift * 0.38;
  const curve = new CatmullRomCurve3([start, p1, mid, p2, end], false, "catmullrom", 0.5);
  return { points: curve.getPoints(48), curve };
}
