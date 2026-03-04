import { createEffect, onMount, onCleanup, type Component } from "solid-js";
import { useTreeState, setSelectedNode, setZoom } from "../store/treeStore";
import { useUIState } from "../store/uiStore";
import { Node } from "../logic/Node";

export const Visualizer: Component = () => {
  const state = useTreeState();
  const { sidebarVisible } = useUIState();
  let canvasRef: HTMLCanvasElement | undefined;
  let isPanning = false;
  let lastMousePos = { x: 0, y: 0 };
  let isSpacePressed = false;

  const getTransformedPoint = (x: number, y: number) => {
    return {
      x: (x - state.offset.x) / state.scale,
      y: (y - state.offset.y) / state.scale
    };
  };

  const setNodeRadius = (canvas: HTMLCanvasElement, layers: Node[][]) => {
    if (layers.length === 0) return;
    
    let bottomLayerCount = 0;
    const traverse = (n: Node) => {
      if (n.children.length === 0) bottomLayerCount += 1;
      else n.children.forEach(traverse);
    };
    if (layers[0][0]) traverse(layers[0][0]);

    const xDiam = canvas.width / (0.5 + 1.5 * bottomLayerCount);
    const yDiam = canvas.height / (1 + 2 * layers.length);
    Node.radius = Math.min(xDiam, yDiam) / 2;
  };

  const setNodePositions = (canvas: HTMLCanvasElement, layers: Node[][]) => {
    if (layers.length === 0) return;
    
    let bottomLayerCount = 0;
    const traverseCount = (n: Node) => {
      if (n.children.length === 0) bottomLayerCount += 1;
      else n.children.forEach(traverseCount);
    };
    if (layers[0][0]) traverseCount(layers[0][0]);

    const xOffset = (canvas.width - Node.radius * (1 + 3 * bottomLayerCount)) / 2;
    const yOffset = (canvas.height - Node.radius * (1 + 4 * layers.length)) / 2;
    
    let count = 2;
    const traverseSetLeafPos = (n: Node) => {
      if (n.children.length === 0) {
        n.pos[0] = xOffset + count * Node.radius;
        n.pos[1] = yOffset + (2 + 4 * n.layer) * Node.radius;
        count += 3;
      } else {
        n.children.forEach(traverseSetLeafPos);
      }
    };
    if (layers[0][0]) traverseSetLeafPos(layers[0][0]);

    // Internal nodes positions based on children
    for (let l = layers.length - 2; l >= 0; l--) {
      for (const node of layers[l]) {
        if (node.children.length > 0) {
          node.pos[0] = (node.children[0].pos[0] + node.children[node.children.length - 1].pos[0]) / 2;
          node.pos[1] = yOffset + (2 + 4 * node.layer) * Node.radius;
        }
      }
    }
  };

  const draw = () => {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
    
    ctx.translate(state.offset.x, state.offset.y);
    ctx.scale(state.scale, state.scale);

    if (state.root) {
      setNodeRadius(canvasRef, state.layers);
      setNodePositions(canvasRef, state.layers);
      state.root.draw(ctx, state.useAlphaBeta, state.selectedNode === state.root, state.showHistory);
      
      // Handle highlighting for other selected nodes
      if (state.selectedNode && state.selectedNode !== state.root) {
         state.selectedNode.draw(ctx, state.useAlphaBeta, true, state.showHistory);
      }
      
      // Also draw algorithm's current node highlight if running
      if (state.isRunning && state.currentNode) {
        ctx.lineWidth = Math.max(3, Node.radius / 5);
        ctx.strokeStyle = "#007bff"; // Blue highlight for algorithm
        ctx.beginPath();
        ctx.arc(state.currentNode.pos[0], state.currentNode.pos[1], Node.radius * 1.3, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const resize = () => {
    if (canvasRef) {
      const parent = canvasRef.parentElement;
      if (parent) {
        canvasRef.width = parent.clientWidth;
        canvasRef.height = parent.clientHeight;
        draw();
      }
    }
  };

  onMount(() => {
    window.addEventListener("resize", resize);
    resize();

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.code === "Space") isSpacePressed = true;
    };
    const handleKeyup = (e: KeyboardEvent) => {
      if (e.code === "Space") isSpacePressed = false;
    };
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);

    onCleanup(() => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("keyup", handleKeyup);
    });
  });

  createEffect(() => {
    // Redraw whenever state changes
    state.root;
    state.selectedNode;
    state.currentNode;
    state.useAlphaBeta;
    state.showHistory;
    state.isRunning;
    state.scale;
    state.offset;
    state.layers;
    draw();
  });

  createEffect(() => {
    // Re-calculate size when sidebar visibility changes
    if (sidebarVisible() || !sidebarVisible()) {
      // Delay slightly to allow DOM to update classes if needed
      setTimeout(resize, 0);
    }
  });

  const onMouseDown = (e: MouseEvent) => {
    const transformed = getTransformedPoint(e.offsetX, e.offsetY);
    const isPanModifier = e.button === 1 || e.button === 2 || (e.button === 0 && isSpacePressed);
    
    if (isPanModifier) {
      isPanning = true;
      lastMousePos = { x: e.offsetX, y: e.offsetY };
      return;
    }

    const clickedNode = state.root?.getNodeAtPosition(transformed.x, transformed.y) || null;
    setSelectedNode(clickedNode);
    
    if (!clickedNode) {
      isPanning = true;
      lastMousePos = { x: e.offsetX, y: e.offsetY };
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (isPanning) {
      const dx = e.offsetX - lastMousePos.x;
      const dy = e.offsetY - lastMousePos.y;
      setZoom(state.scale, { x: state.offset.x + dx, y: state.offset.y + dy });
      lastMousePos = { x: e.offsetX, y: e.offsetY };
    }
  };

  const onMouseUp = () => {
    isPanning = false;
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const zoomFactor = e.deltaY > 0 ? (1 - zoomSpeed) : (1 + zoomSpeed);
    const newScale = Math.max(0.1, Math.min(state.scale * zoomFactor, 5.0));
    const realZoomFactor = newScale / state.scale;

    const newOffsetX = e.offsetX - (e.offsetX - state.offset.x) * realZoomFactor;
    const newOffsetY = e.offsetY - (e.offsetY - state.offset.y) * realZoomFactor;
    
    setZoom(newScale, { x: newOffsetX, y: newOffsetY });
  };

  return (
    <div 
      id="canvas-area" 
      class={sidebarVisible() ? "col-lg-9 col-md-8 p-3 d-flex flex-column h-100" : "col-12 p-3 d-flex flex-column h-100"}
    >
      <div class="canvas-container flex-grow-1 d-flex align-items-center justify-content-center bg-white border rounded shadow-sm position-relative overflow-hidden">
        <canvas 
          ref={canvasRef} 
          id="canvas"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onWheel={onWheel}
          onContextMenu={(e) => e.preventDefault()}
          style={{ cursor: isPanning ? "grabbing" : "crosshair", width: "100%", height: "100%", display: "block" }}
        />
      </div>
    </div>
  );
};
