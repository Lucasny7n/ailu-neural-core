import { useEffect, useMemo } from "react";
import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Vector3 } from "three";
import { useNeuralStore } from "../../store/useNeuralStore";
import { useMemoryStore } from "../memory-core/useMemoryStore";
import { emitNeuralEvent } from "./neuralEvents";
import {
  neuralConnections,
  neuralNodes,
  getNodePath,
  nodeById,
  type NeuralNode as NeuralNodeData,
} from "./neuralGraph";
import { NeuralCameraRig } from "./NeuralCameraRig";
import { NeuralConnection } from "./NeuralConnection";
import { NeuralCore } from "./NeuralCore";
import { NeuralNode } from "./NeuralNode";
import { NeuralParticles } from "./NeuralParticles";
import { memoryGraphNodeId } from "./memoryGraphNodeId";

export function NeuralScene(): JSX.Element {
  const selectedNodeId = useNeuralStore((state) => state.selectedNodeId);
  const expandedNodeIds = useNeuralStore((state) => state.expandedNodeIds);
  const focusedConnectionId = useNeuralStore((state) => state.focusedConnectionId);
  const nodeStatusById = useNeuralStore((state) => state.nodeStatusById);
  const config = useNeuralStore((state) => state.config);
  const memoryGraph = useMemoryStore((state) => state.graph);
  const getMemoryGraph = useMemoryStore((state) => state.getGraph);
  const selectNode = useNeuralStore((state) => state.selectNode);
  const startConnectionTravel = useNeuralStore((state) => state.startConnectionTravel);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);

  useEffect(() => {
    if (memoryGraph.nodes.length === 0) {
      void getMemoryGraph();
    }
  }, [getMemoryGraph, memoryGraph.nodes.length]);

  const visible = useMemo(() => buildVisibleGraph(expandedNodeIds, memoryGraph), [expandedNodeIds, memoryGraph]);
  const selectedNode = nodeById.get(selectedNodeId) ?? nodeById.get("core") ?? neuralNodes[0];
  const target = new Vector3(...selectedNode.position);
  const activeNodeIds = useMemo(() => {
    const pathIds = getNodePath(selectedNodeId).map((node) => node.id);
    return new Set([...pathIds, ...(selectedNode.children ?? [])]);
  }, [selectedNode, selectedNodeId]);

  if (!hasWebGl()) {
    return (
      <div className="webgl-fallback">
        <strong>WebGL indisponivel</strong>
        <span>A interface 3D precisa de aceleracao grafica ativa.</span>
      </div>
    );
  }

  return (
    <Canvas
      className="neural-canvas"
      dpr={[1, 1.5]}
      camera={{ position: [0, 2.8, 9], fov: 58, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onPointerMissed={() => selectNode("core")}
    >
      <color attach="background" args={["#02070d"]} />
      <fog attach="fog" args={["#02070d", 9, 24]} />
      <ambientLight intensity={0.25} />
      <directionalLight color="#38d5ff" position={[4, 6, 5]} intensity={1.2} />
      <pointLight color="#198cff" position={[-4, -3, -5]} intensity={2} distance={18} />
      <Stars radius={40} depth={18} count={900} factor={1.6} saturation={0.1} fade speed={0.25} />

      {visible.connections.map((connection) => {
        const from = visible.nodeMap.get(connection.from);
        const to = visible.nodeMap.get(connection.to);
        if (!from || !to) {
          return null;
        }
        const dynamicConnection = {
          ...connection,
          status: nodeStatusById[to.id] ?? nodeStatusById[from.id] ?? connection.status,
        };
        return (
          <NeuralConnection
            key={connection.id}
            connection={dynamicConnection}
            from={from}
            to={to}
            focused={focusedConnectionId === connection.id}
            dimmed={selectedNodeId !== "core" && !activeNodeIds.has(connection.from) && !activeNodeIds.has(connection.to)}
            onTravel={() => {
              startConnectionTravel(connection.id, connection.from, connection.to);
              selectNode(connection.to);
              addTelemetry({ level: "success", message: `NAV travel connection=${connection.id} target=${connection.to.toUpperCase()}` });
              emitNeuralEvent({ name: "connection:travel", connectionId: connection.id, nodeId: connection.to });
            }}
          />
        );
      })}

      <NeuralParticles
        connections={visible.connections}
        nodes={visible.nodeMap}
        focusedConnectionId={focusedConnectionId}
        reducedMotion={config.reducedMotion}
      />

      {visible.nodes.map((node) => {
        const status = nodeStatusById[node.id] ?? node.status;
        if (node.type === "core") {
          return (
            <NeuralCore
              key={node.id}
              node={node}
              status={status}
              selected={selectedNodeId === node.id}
              onSelect={() => {
                selectNode(node.id);
                emitNeuralEvent({ name: "node:selected", nodeId: node.id });
              }}
            />
          );
        }
        return (
          <NeuralNode
            key={node.id}
            node={node}
            status={status}
            selected={selectedNodeId === node.id}
            dimmed={selectedNodeId !== "core" && !activeNodeIds.has(node.id)}
            onSelect={() => {
              selectNode(node.id);
              addTelemetry({ level: "info", message: `NAV focus node=${node.id.toUpperCase()}` });
              emitNeuralEvent({ name: "node:selected", nodeId: node.id });
            }}
          />
        );
      })}

      <NeuralCameraRig focusedNode={selectedNode} />
      <OrbitControls
        makeDefault
        target={target}
        enableDamping
        dampingFactor={0.08}
        minDistance={2.8}
        maxDistance={18}
        rotateSpeed={0.62}
        zoomSpeed={0.7}
      />
    </Canvas>
  );
}

function buildVisibleGraph(expandedNodeIds: string[], memoryGraph: ReturnType<typeof useMemoryStore.getState>["graph"]): {
  nodes: NeuralNodeData[];
  nodeMap: Map<string, NeuralNodeData>;
  connections: typeof neuralConnections;
} {
  const ids = new Set<string>(["core"]);
  neuralNodes.filter((node) => node.depth === 1).forEach((node) => ids.add(node.id));
  expandedNodeIds.forEach((nodeId) => {
    ids.add(nodeId);
    getNodePath(nodeId).forEach((pathNode) => ids.add(pathNode.id));
    const node = nodeById.get(nodeId);
    node?.children?.forEach((childId) => ids.add(childId));
  });

  const dynamicMemoryVisible = expandedNodeIds.includes("memory");
  const dynamicMemoryNodes: NeuralNodeData[] = dynamicMemoryVisible
    ? memoryGraph.nodes.slice(0, 24).map((node, index) => {
        const angle = (index / Math.max(memoryGraph.nodes.slice(0, 24).length, 1)) * Math.PI * 2;
        const radius = 2.3 + (index % 3) * 0.7;
        return {
          id: memoryGraphNodeId(node.id),
          label: node.label.toUpperCase().slice(0, 18),
          type: "memory",
          status: node.kind === "decision" || node.kind === "rule" ? "ready" : "idle",
          description: `${node.kind} persistida no Memory Core.`,
          depth: 3,
          parentId: "memory",
          position: [Math.cos(angle) * radius, -6.1 + (index % 4) * 0.25, -2.9 + Math.sin(angle) * radius],
        };
      })
    : [];
  const nodes = [...neuralNodes.filter((node) => ids.has(node.id)), ...dynamicMemoryNodes];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const staticConnections = neuralConnections.filter(
    (connection) => nodeMap.has(connection.from) && nodeMap.has(connection.to),
  );
  const memoryConnections = dynamicMemoryVisible
    ? [
        ...dynamicMemoryNodes.map((node) => ({
          id: `memory-root-${node.id}`,
          from: "memory",
          to: node.id,
          status: node.status,
          label: "vault",
          strength: 0.5,
        })),
        ...memoryGraph.edges.slice(0, 64).flatMap((edge) => {
          const from = memoryGraphNodeId(edge.fromId);
          const to = memoryGraphNodeId(edge.toId);
          if (!nodeMap.has(from) || !nodeMap.has(to)) {
            return [];
          }
          return [
            {
              id: `memory-edge-${edge.id}`,
              from,
              to,
              status: "ready" as const,
              label: edge.relation,
              strength: Math.min(1, edge.weight / 3),
            },
          ];
        }),
      ]
    : [];
  const connections = [...staticConnections, ...memoryConnections];
  return { nodes, nodeMap, connections };
}


function hasWebGl(): boolean {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
}
