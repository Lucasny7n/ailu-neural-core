import { Component, useEffect, useMemo, type ReactNode } from "react";
import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Vector3 } from "three";
import { useNeuralStore } from "../../store/useNeuralStore";
import { useMemoryStore } from "../memory-core/useMemoryStore";
import { GalaxyConnection } from "./GalaxyConnection";
import { GalaxyCore } from "./GalaxyCore";
import { GalaxyFocusCamera } from "./GalaxyFocusCamera";
import { GalaxyOrbit } from "./GalaxyOrbit";
import { GalaxyParticles } from "./GalaxyParticles";
import { GalaxyPlanet } from "./GalaxyPlanet";
import { GalaxyStar } from "./GalaxyStar";
import {
  buildMemoryGalaxy,
  galaxyConnections,
  galaxyObjects,
  toActiveContext,
  type ActiveContext,
  type GalaxyConnection as GalaxyConnectionData,
  type GalaxyObject,
} from "./galaxyGraph";
import { emitNeuralEvent } from "./neuralEvents";

export function NeuralGalaxyScene(): JSX.Element {
  const viewMode = useNeuralStore((state) => state.viewMode);
  const selectedGalaxyObjectId = useNeuralStore((state) => state.selectedGalaxyObjectId);
  const selectedConnectionId = useNeuralStore((state) => state.selectedConnectionId);
  const activePlan = useNeuralStore((state) => state.activePlan);
  const config = useNeuralStore((state) => state.config);
  const selectGalaxyObject = useNeuralStore((state) => state.selectGalaxyObject);
  const selectGalaxyConnection = useNeuralStore((state) => state.selectGalaxyConnection);
  const returnToCore = useNeuralStore((state) => state.returnToCore);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);
  const memoryGraph = useMemoryStore((state) => state.graph);
  const getMemoryGraph = useMemoryStore((state) => state.getGraph);
  const getMemoryStats = useMemoryStore((state) => state.getStats);

  useEffect(() => {
    void getMemoryGraph();
    void getMemoryStats();
  }, [getMemoryGraph, getMemoryStats]);

  const dynamicMemory = useMemo(() => buildMemoryGalaxy(memoryGraph), [memoryGraph]);
  const allObjects = useMemo(() => [...galaxyObjects, ...dynamicMemory.objects], [dynamicMemory.objects]);
  const objectMap = useMemo(() => new Map(allObjects.map((object) => [object.id, object])), [allObjects]);
  const allConnections = useMemo(
    () =>
      [...galaxyConnections, ...dynamicMemory.connections].filter(
        (connection) => objectMap.has(connection.fromId) && objectMap.has(connection.toId),
      ),
    [dynamicMemory.connections, objectMap],
  );
  const selectedObject = objectMap.get(selectedGalaxyObjectId) ?? objectMap.get("core") ?? allObjects[0];
  const activeIds = useMemo(() => buildActiveObjectSet(selectedObject, selectedConnectionId, allObjects, allConnections), [
    selectedObject,
    selectedConnectionId,
    allObjects,
    allConnections,
  ]);
  const renderedConnections = useMemo(
    () =>
      config.showSecondaryConnections || viewMode === "exploration"
        ? allConnections
        : allConnections.filter((connection) => connection.active || connection.strength >= 0.62 || activeIds.has(connection.fromId) || activeIds.has(connection.toId)),
    [activeIds, allConnections, config.showSecondaryConnections, viewMode],
  );
  const dpr: [number, number] = config.galaxyQuality === "ultra" ? [1.25, 1.8] : config.galaxyQuality === "low" ? [0.8, 1.1] : [1, 1.5];
  const starCount = config.galaxyQuality === "ultra" ? 1500 : config.galaxyQuality === "low" ? 650 : 1050;
  const particleLimit = config.particleDensity === "high" ? config.maxParticles : config.particleDensity === "low" ? Math.floor(config.maxParticles * 0.42) : Math.floor(config.maxParticles * 0.7);
  
  // Configurações de câmera por modo
  const cockpitCamera = useMemo(() => ({ position: [0, 7.5, 22] as [number, number, number], fov: 52, near: 0.1, far: 900 }), []);
  const explorationCamera = useMemo(() => ({ position: [0, 18, 70] as [number, number, number], fov: 58, near: 0.1, far: 1200 }), []);
  const currentCamera = viewMode === "cockpit" ? cockpitCamera : explorationCamera;
  
  // Obter posição do objeto baseado no modo
  const getObjectPosition = useMemo(() => {
    return (obj: GalaxyObject): [number, number, number] => {
      if (viewMode === "cockpit" && obj.cockpitPosition) {
        return obj.cockpitPosition;
      }
      return obj.position;
    };
  }, [viewMode]);
  
  // Obter escala do objeto baseado no modo
  const getObjectScale = useMemo(() => {
    return (obj: GalaxyObject): number => {
      if (viewMode === "cockpit" && obj.cockpitScale) {
        return obj.cockpitScale;
      }
      if (viewMode === "exploration" && obj.explorationScale) {
        return obj.explorationScale;
      }
      return 1;
    };
  }, [viewMode]);
  
  // Criar objetos com posições ajustadas para o modo atual
  const modeAdjustedObjects = useMemo(() => {
    return allObjects.map((obj) => ({
      ...obj,
      position: getObjectPosition(obj),
      displayScale: getObjectScale(obj),
    }));
  }, [allObjects, getObjectPosition, getObjectScale]);
  
  const modeAdjustedObjectMap = useMemo(() => {
    return new Map(modeAdjustedObjects.map((object) => [object.id, object]));
  }, [modeAdjustedObjects]);
  const selectedAdjustedObject = modeAdjustedObjectMap.get(selectedObject.id) ?? selectedObject;
  const target = useMemo(() => new Vector3(...selectedAdjustedObject.position), [selectedAdjustedObject.position]);

  if (!hasWebGl()) {
    return (
      <div className="webgl-fallback">
        <strong>Falha ao carregar Galáxia Neural</strong>
        <span>Verifique WebGL ou veja os logs.</span>
      </div>
    );
  }

  function handleObjectSelect(object: GalaxyObject): void {
    const context = toActiveContext(object);
    selectGalaxyObject(object.id, context);
    addTelemetry({ level: "info", message: `Contexto ativo: ${object.label}` });
    emitNeuralEvent({ name: "node:selected", nodeId: object.id });
  }

  function handleConnectionSelect(connection: GalaxyConnectionData): void {
    const context = contextFromConnection(connection, objectMap);
    selectGalaxyConnection(connection.id, context);
    addTelemetry({ level: "info", message: `Conexão selecionada: ${context.title}` });
    emitNeuralEvent({ name: "connection:travel", connectionId: connection.id, nodeId: connection.toId });
  }

  return (
    <CanvasErrorBoundary>
      <div className="neural-galaxy-stage">
        <Canvas
          className="neural-canvas"
          dpr={dpr}
          camera={currentCamera}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onPointerMissed={returnToCore}
        >
          <color attach="background" args={["#000206"]} />
          <fog attach="fog" args={["#000206", viewMode === "cockpit" ? 35 : 45, viewMode === "cockpit" ? 500 : 600]} />
          <ambientLight intensity={0.46} />
          <directionalLight color="#38d5ff" position={[10, 20, 10]} intensity={2.1} />
          <pointLight color="#38d5ff" position={[0, 0, 8]} intensity={viewMode === "cockpit" ? 10 : 5} distance={55} />
          <pointLight color="#0f8cff" position={[-15, -10, -15]} intensity={4.5} distance={120} />
          <pointLight color="#c247ff" position={[-20, -12, -8]} intensity={2.8} distance={100} />
          <Stars radius={viewMode === "cockpit" ? 200 : 300} depth={80} count={starCount * 2} factor={3.5} saturation={0.5} fade speed={0.4} />

        {config.showOrbits
          ? modeAdjustedObjects.map((object) => {
              const parent = object.parentId ? modeAdjustedObjectMap.get(object.parentId) : undefined;
              return parent ? <GalaxyOrbit key={`orbit-${object.id}`} object={object} parent={parent} active={activeIds.has(object.id)} /> : null;
            })
          : null}

        {renderedConnections.map((connection) => {
          const from = modeAdjustedObjectMap.get(connection.fromId);
          const to = modeAdjustedObjectMap.get(connection.toId);
          if (!from || !to) {
            return null;
          }
          return (
            <GalaxyConnection
              key={connection.id}
              connection={connection}
              from={from}
              to={to}
              selected={selectedConnectionId === connection.id}
              dimmed={selectedObject.id !== "core" && !activeIds.has(connection.fromId) && !activeIds.has(connection.toId)}
              onSelect={() => handleConnectionSelect(connection)}
            />
          );
        })}

        <GalaxyParticles
          connections={renderedConnections}
          objects={modeAdjustedObjectMap}
          selectedConnectionId={selectedConnectionId}
          reducedMotion={config.reducedMotion}
          maxParticles={particleLimit}
        />

        {modeAdjustedObjects.map((object) => {
          const selected = selectedObject.id === object.id;
          const dimmed = selectedObject.id !== "core" && !activeIds.has(object.id);
          if (object.kind === "core") {
            return (
              <GalaxyCore
                key={object.id}
                object={object}
                selected={selected}
                approvalActive={Boolean(activePlan)}
                onSelect={() => handleObjectSelect(object)}
              />
            );
          }
          if (object.kind === "star") {
            return <GalaxyStar key={object.id} object={object} selected={selected} dimmed={dimmed} onSelect={() => handleObjectSelect(object)} />;
          }
          return (
            <GalaxyPlanet
              key={object.id}
              object={object}
              parent={object.parentId ? modeAdjustedObjectMap.get(object.parentId) : undefined}
              selected={selected}
              dimmed={dimmed}
              onSelect={() => handleObjectSelect(object)}
            />
          );
        })}

          <GalaxyFocusCamera focusedObject={selectedAdjustedObject} />
          <OrbitControls
            makeDefault
            target={target}
            enableDamping
            dampingFactor={0.06}
            minDistance={viewMode === "cockpit" ? 2.5 : 4}
            maxDistance={viewMode === "cockpit" ? 55 : 140}
            rotateSpeed={0.55}
            zoomSpeed={0.85}
            enablePan={viewMode === "exploration"}
            panSpeed={0.6}
          />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}

function contextFromConnection(
  connection: GalaxyConnectionData,
  objects: Map<string, GalaxyObject>,
): ActiveContext {
  const from = objects.get(connection.fromId);
  const to = objects.get(connection.toId);
  return {
    id: connection.id,
    kind: "connection",
    title: `${from?.label ?? connection.fromId} → ${to?.label ?? connection.toId}`,
    subtitle: connection.relation,
    description: `Relação neural: ${connection.relation}. Força ${Math.round(connection.strength * 100)}%.`,
    domain: from?.domain ?? to?.domain,
    nodeId: to?.id ?? from?.id,
    relatedIds: [connection.fromId, connection.toId],
    createdAt: new Date().toISOString(),
  };
}

function buildActiveObjectSet(
  selectedObject: GalaxyObject,
  selectedConnectionId: string | undefined,
  objects: GalaxyObject[],
  connections: GalaxyConnectionData[],
): Set<string> {
  const ids = new Set<string>(["core", selectedObject.id, ...(selectedObject.relatedIds ?? [])]);
  let cursor: GalaxyObject | undefined = selectedObject;
  const map = new Map(objects.map((object) => [object.id, object]));
  while (cursor?.parentId) {
    ids.add(cursor.parentId);
    cursor = map.get(cursor.parentId);
  }
  objects.filter((object) => object.parentId === selectedObject.id).forEach((object) => ids.add(object.id));
  const selectedConnection = connections.find((connection) => connection.id === selectedConnectionId);
  if (selectedConnection) {
    ids.add(selectedConnection.fromId);
    ids.add(selectedConnection.toId);
  }
  return ids;
}

function hasWebGl(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
}

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className="webgl-fallback">
          <strong>Falha ao carregar Galáxia Neural</strong>
          <span>Verifique WebGL ou veja os logs.</span>
        </div>
      );
    }
    return this.props.children;
  }
}
