import { useMemo } from "react";
import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Vector3 } from "three";
import { useNeuralStore } from "../../store/useNeuralStore";
import { emitNeuralEvent } from "./neuralEvents";
import {
  neuralConnections,
  neuralNodes,
  nodeById,
  type NeuralNode as NeuralNodeData,
} from "./neuralGraph";
import { NeuralCameraRig } from "./NeuralCameraRig";
import { NeuralConnection } from "./NeuralConnection";
import { NeuralCore } from "./NeuralCore";
import { NeuralNode } from "./NeuralNode";
import { NeuralParticles } from "./NeuralParticles";

export function NeuralScene(): JSX.Element {
  const selectedNodeId = useNeuralStore((state) => state.selectedNodeId);
  const expandedNodeIds = useNeuralStore((state) => state.expandedNodeIds);
  const focusedConnectionId = useNeuralStore((state) => state.focusedConnectionId);
  const nodeStatusById = useNeuralStore((state) => state.nodeStatusById);
  const config = useNeuralStore((state) => state.config);
  const selectNode = useNeuralStore((state) => state.selectNode);
  const focusConnection = useNeuralStore((state) => state.focusConnection);

  const visible = useMemo(() => buildVisibleGraph(expandedNodeIds), [expandedNodeIds]);
  const selectedNode = nodeById.get(selectedNodeId) ?? nodeById.get("core") ?? neuralNodes[0];
  const target = new Vector3(...selectedNode.position);

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
        return (
          <NeuralConnection
            key={connection.id}
            connection={connection}
            from={from}
            to={to}
            focused={focusedConnectionId === connection.id}
            onTravel={() => {
              focusConnection(connection.id);
              selectNode(connection.to);
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
            onSelect={() => {
              selectNode(node.id);
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

function buildVisibleGraph(expandedNodeIds: string[]): {
  nodes: NeuralNodeData[];
  nodeMap: Map<string, NeuralNodeData>;
  connections: typeof neuralConnections;
} {
  const ids = new Set<string>(["core"]);
  neuralNodes.filter((node) => node.depth === 1).forEach((node) => ids.add(node.id));
  expandedNodeIds.forEach((nodeId) => {
    ids.add(nodeId);
    const node = nodeById.get(nodeId);
    node?.children?.forEach((childId) => ids.add(childId));
  });

  const nodes = neuralNodes.filter((node) => ids.has(node.id));
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const connections = neuralConnections.filter(
    (connection) => nodeMap.has(connection.from) && nodeMap.has(connection.to),
  );
  return { nodes, nodeMap, connections };
}

function hasWebGl(): boolean {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
}
