import { useMemo } from "react";
import { useMemoryStore } from "../memory-core/useMemoryStore";
import { useNeuralStore } from "../../store/useNeuralStore";
import { buildMemoryGalaxy, galaxyObjectById, getGalaxyPath, toActiveContext } from "./galaxyGraph";

export function GalaxyBreadcrumb(): JSX.Element {
  const selectedGalaxyObjectId = useNeuralStore((state) => state.selectedGalaxyObjectId);
  const selectGalaxyObject = useNeuralStore((state) => state.selectGalaxyObject);
  const goBackFocus = useNeuralStore((state) => state.goBackFocus);
  const returnToCore = useNeuralStore((state) => state.returnToCore);
  const memoryGraph = useMemoryStore((state) => state.graph);
  const dynamicMemory = useMemo(() => buildMemoryGalaxy(memoryGraph), [memoryGraph]);
  const dynamicObject = dynamicMemory.objects.find((object) => object.id === selectedGalaxyObjectId);
  const path = dynamicObject
    ? [galaxyObjectById.get("core"), galaxyObjectById.get("memory"), galaxyObjectById.get(dynamicObject.parentId ?? "memory"), dynamicObject].filter(Boolean)
    : getGalaxyPath(selectedGalaxyObjectId);

  return (
    <nav className="galaxy-breadcrumb hud-corners" aria-label="Caminho da galáxia">
      <button type="button" className="hud-button hud-button--micro" onClick={returnToCore}>
        Voltar ao Núcleo
      </button>
      <button type="button" className="hud-button hud-button--micro" onClick={goBackFocus}>
        Voltar
      </button>
      <div className="breadcrumb-path">
        {path.map((object, index) => {
          if (!object) {
            return null;
          }
          return (
            <button
              key={`${object.id}-${index}`}
              type="button"
              onClick={() => selectGalaxyObject(object.id, toActiveContext(object))}
            >
              {index > 0 ? "/" : ""}
              {object.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
