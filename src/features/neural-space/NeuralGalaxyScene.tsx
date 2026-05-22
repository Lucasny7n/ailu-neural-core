import { useEffect, useMemo } from "react";
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
      config.showSecondaryConnections
        ? allConnections
        : allConnections.filter((connection) => connection.active || connection.strength >= 0.62 || activeIds.has(connection.fromId) || activeIds.has(connection.toId)),
    [activeIds, allConnections, config.showSecondaryConnections],
  );
  const target = useMemo(() => new Vector3(...selectedObject.position), [selectedObject.position]);
  const dpr: [number, number] = config.galaxyQuality === "ultra" ? [1.25, 1.8] : config.galaxyQuality === "low" ? [0.8, 1.1] : [1, 1.5];
  const starCount = config.galaxyQuality === "ultra" ? 1500 : config.galaxyQuality === "low" ? 650 : 1050;
  const particleLimit = config.particleDensity === "high" ? config.maxParticles : config.particleDensity === "low" ? Math.floor(config.maxParticles * 0.42) : Math.floor(config.maxParticles * 0.7);

  if (!hasWebGl()) {
    return (
      <div className="webgl-fallback">
        <strong>WebGL indisponível</strong>
        <span>A galáxia neural 3D precisa de aceleração gráfica ativa.</span>
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
    <Canvas
      className="neural-canvas"
      dpr={dpr}
      camera={{ position: [0, 3.5, 12.5], fov: 62, near: 0.1, far: 150 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onPointerMissed={returnToCore}
    >
      <color attach="background" args={["#000308"]} />
      <fog attach="fog" args={["#000308", 15, 45]} />
      <ambientLight intensity={0.35} />
      <directionalLight color="#38d5ff" position={[5, 10, 5]} intensity={1.5} />
      <pointLight color="#0f8cff" position={[-8, -5, -8]} intensity={3.5} distance={35} />
      <pointLight color="#c247ff" position={[-10, -6, -4]} intensity={2.2} distance={28} />
      <Stars radius={60} depth={35} count={starCount * 1.5} factor={2.2} saturation={0.4} fade speed={0.28} />

      {config.showOrbits
        ? allObjects.map((object) => {
            const parent = object.parentId ? objectMap.get(object.parentId) : undefined;
            return parent ? <GalaxyOrbit key={`orbit-${object.id}`} object={object} parent={parent} active={activeIds.has(object.id)} /> : null;
          })
        : null}

      {renderedConnections.map((connection) => {
        const from = objectMap.get(connection.fromId);
        const to = objectMap.get(connection.toId);
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
        objects={objectMap}
        selectedConnectionId={selectedConnectionId}
        reducedMotion={config.reducedMotion}
        maxParticles={particleLimit}
      />

      {allObjects.map((object) => {
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
            parent={object.parentId ? objectMap.get(object.parentId) : undefined}
            selected={selected}
            dimmed={dimmed}
            onSelect={() => handleObjectSelect(object)}
          />
        );
      })}

      <GalaxyFocusCamera focusedObject={selectedObject} />
      <OrbitControls
        makeDefault
        target={target}
        enableDamping
        dampingFactor={0.08}
        minDistance={2.6}
        maxDistance={18}
        rotateSpeed={0.58}
        zoomSpeed={0.7}
      />
    </Canvas>
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
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
}
