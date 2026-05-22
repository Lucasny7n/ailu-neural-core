import { useEffect, useMemo } from "react";
import { useMemoryStore } from "../memory-core/useMemoryStore";
import { useNeuralStore } from "../../store/useNeuralStore";
import { buildMemoryGalaxy, galaxyObjectById, toActiveContext } from "./galaxyGraph";

export function ActiveContextBridge(): null {
  const selectedGalaxyObjectId = useNeuralStore((state) => state.selectedGalaxyObjectId);
  const activeContext = useNeuralStore((state) => state.activeContext);
  const setActiveContext = useNeuralStore((state) => state.setActiveContext);
  const memoryGraph = useMemoryStore((state) => state.graph);
  const dynamicMemory = useMemo(() => buildMemoryGalaxy(memoryGraph), [memoryGraph]);

  useEffect(() => {
    if (activeContext?.id === selectedGalaxyObjectId) {
      return;
    }
    const object =
      galaxyObjectById.get(selectedGalaxyObjectId) ??
      dynamicMemory.objects.find((item) => item.id === selectedGalaxyObjectId);
    if (object) {
      setActiveContext(toActiveContext(object));
    }
  }, [activeContext?.id, dynamicMemory.objects, selectedGalaxyObjectId, setActiveContext]);

  return null;
}
