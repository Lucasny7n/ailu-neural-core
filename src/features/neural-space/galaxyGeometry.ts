import { CatmullRomCurve3, Vector3 } from "three";
import type { GalaxyObject } from "./galaxyGraph";

export function buildGalaxyCable(
  from: GalaxyObject,
  to: GalaxyObject,
  strength: number,
): { curve: CatmullRomCurve3; points: Vector3[] } {
  const start = new Vector3(...from.position);
  const end = new Vector3(...to.position);
  const midpoint = start.clone().lerp(end, 0.5);
  const direction = end.clone().sub(start);
  const lift = new Vector3(-direction.z, direction.length() * 0.16 + strength * 0.55, direction.x).normalize();
  const controlA = start.clone().lerp(end, 0.34).add(lift.clone().multiplyScalar(0.55 + strength));
  const controlB = midpoint.add(lift.clone().multiplyScalar(0.3 + strength * 0.5));
  const controlC = start.clone().lerp(end, 0.68).add(lift.clone().multiplyScalar(0.42 + strength * 0.85));
  const curve = new CatmullRomCurve3([start, controlA, controlB, controlC, end]);
  return { curve, points: curve.getPoints(72) };
}
