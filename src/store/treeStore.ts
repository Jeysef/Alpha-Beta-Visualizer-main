import { createStore, produce } from "solid-js/store";
import { Node } from "../logic/Node";
import sampleData from "./sampleData.json";

export interface TreeState {
  root: Node | null;
  selectedNode: Node | null;
  currentNode: Node | null; // Algorithm's active node
  useAlphaBeta: boolean;
  isRunning: boolean;
  isComplete: boolean;
  history: any[];
  scale: number;
  offset: { x: number; y: number };
  layers: Node[][];
  showHistory: boolean;
  showLocalPath: boolean;
  showGlobalPath: boolean;
  explorationPath: Node[];
  finalGlobalPath: Node[];
}

const initialState: TreeState = {
  root: null,
  selectedNode: null,
  currentNode: null,
  useAlphaBeta: true,
  isRunning: false,
  isComplete: false,
  history: [],
  scale: 1.0,
  offset: { x: 0, y: 0 },
  layers: [],
  showHistory: false,
  showLocalPath: false,
  showGlobalPath: false,
  explorationPath: [],
  finalGlobalPath: [],
};

const [state, setState] = createStore<TreeState>(initialState);

// Selectors
export const useTreeState = () => state;
export const isAlgorithmComplete = () => state.isComplete;

// Actions
export const setUseAlphaBeta = (value: boolean) => setState("useAlphaBeta", value);
export const setShowHistory = (value: boolean) => setState("showHistory", value);
export const setShowLocalPath = (value: boolean) => setState("showLocalPath", value);
export const setShowGlobalPath = (value: boolean) => setState("showGlobalPath", value);

// Helper to build exploration path from current node to root
const buildExplorationPath = (node: Node | null): Node[] => {
  const path: Node[] = [];
  let current = node;
  while (current) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
};

export const setSelectedNode = (node: Node | null) => {
  if (state.isRunning) return;
  setState("selectedNode", node);
};

export const resetAlgorithm = () => {
  setState(produce((s) => {
    s.isRunning = false;
    s.isComplete = false;
    s.currentNode = null;
    s.history = [];
    s.explorationPath = [];
    s.finalGlobalPath = [];
    if (s.root) {
      const traverse = (n: Node) => {
        n.pruned = false;
        n.step = 0;
        n.alpha = null;
        n.beta = null;
        n.alphaHistory = [];
        n.betaHistory = [];
        n.childSearchDone = false;
        n.currentChildSearch = 0;
        n.currentBestChildIndex = -1;
        n.returnValue = null;
        if (n.children.length > 0) {
          n.value = null;
        }
        n.children.forEach(traverse);
      };
      traverse(s.root);
    }
  }));
};

export const rebuildLayerCache = (root: Node): Node[][] => {
  const layers: Node[][] = [];
  const traverse = (n: Node) => {
    if (!layers[n.layer]) layers[n.layer] = [];
    layers[n.layer].push(n);
    n.children.forEach(traverse);
  };
  traverse(root);
  return layers;
};

export const generateRandomTree = () => {
  const numLayers = 3;
  const totalLayers = numLayers + 1;
  const root = new Node(0, true, null);
  const layers: Node[][] = [[root]];

  for (let l = 0; l < totalLayers - 1; l++) {
    const currentLayerNodes = layers[l];
    const nextLayer: Node[] = [];

    for (const node of currentLayerNodes) {
      const numChildren = l === 0 ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < numChildren; i++) {
        const child = new Node(l + 1, !node.max, node);
        if (l + 1 === totalLayers - 1) {
          child.value = Math.floor(Math.random() * 41) - 20;
        } else {
          child.value = null;
        }
        node.children.push(child);
        nextLayer.push(child);
      }
    }
    if (nextLayer.length > 0) layers.push(nextLayer);
  }

  setState({
    root,
    layers,
    selectedNode: null,
    currentNode: null,
    isRunning: false,
    history: [],
    scale: 1.0,
    offset: { x: 0, y: 0 },
  });
};

// Helpers for finding nodes after deserialization
const getNodePath = (target: Node | null, root: Node | null): number[] | null => {
  if (!target || !root) return null;
  const path: number[] = [];
  let current: Node | null = target;
  while (current && current !== root) {
    if (current.parent) {
      path.unshift(current.parent.children.indexOf(current));
      current = current.parent;
    } else {
      return null;
    }
  }
  return path;
};

const findNodeByPath = (path: number[] | null, root: Node | null): Node | null => {
  if (path === null || !root) return null;
  let current: Node = root;
  for (const index of path) {
    if (current.children[index]) {
      current = current.children[index];
    } else {
      return null;
    }
  }
  return current;
};

// Compute local best paths (each node's preferred child)
export const computeLocalBestPaths = (root: Node | null): Map<Node, Node> => {
  const localBest = new Map<Node, Node>();
  if (!root) return localBest;
  
  const traverse = (node: Node) => {
    if (node.children.length === 0) return;
    
    // Find best child based on current values
    let bestChild: Node | null = null;
    let bestValue: number = node.max ? -Infinity : Infinity;
    
    for (const child of node.children) {
      if (child.value !== null) {
        const isBetter = node.max ? child.value > bestValue : child.value < bestValue;
        if (isBetter) {
          bestValue = child.value;
          bestChild = child;
        }
      }
    }
    
    if (bestChild) {
      localBest.set(node, bestChild);
    }
    
    node.children.forEach(traverse);
  };
  
  traverse(root);
  return localBest;
};

// Compute global best path (optimal path from root to leaf)
export const computeGlobalBestPath = (root: Node | null): Node[] => {
  if (!root || root.children.length === 0) return root ? [root] : [];
  
  const path: Node[] = [];
  let current: Node | null = root;
  
  while (current) {
    path.push(current);
    
    if (current.children.length === 0) break;
    
    // Find the child that matches the current node's value
    let bestChild: Node | null = null;
    for (const child of current.children) {
      if (child.value === current.value) {
        bestChild = child;
        break;
      }
    }
    
    // If no exact match, pick the best one
    if (!bestChild && current.children.length > 0) {
      let bestValue: number = current.max ? -Infinity : Infinity;
      for (const child of current.children) {
        if (child.value !== null) {
          const isBetter = current.max ? child.value > bestValue : child.value < bestValue;
          if (isBetter) {
            bestValue = child.value;
            bestChild = child;
          }
        }
      }
    }
    
    current = bestChild;
  }
  
  return path;
};

export const stepForward = () => {
  setState(produce((s) => {
    if (!s.root || s.isComplete) return;

    // Save history
    s.history.push(JSON.stringify({
      root: s.root.serialize(),
      currentNodePath: getNodePath(s.currentNode, s.root),
      isRunning: s.isRunning,
      explorationPath: s.explorationPath.map(n => getNodePath(n, s.root)),
    }));

    if (s.currentNode) {
      s.currentNode = s.currentNode.minimax(s.useAlphaBeta);
      // Update exploration path to show where algorithm currently is
      s.explorationPath = buildExplorationPath(s.currentNode);
      
      // Check if algorithm just completed
      if (!s.currentNode) {
        s.isComplete = true;
        s.isRunning = false;
        s.finalGlobalPath = computeGlobalBestPath(s.root);
        s.showGlobalPath = true; // Auto-enable global path highlight
        s.explorationPath = [];
      }
    } else {
      s.isRunning = true;
      s.selectedNode = null;
      s.root.alpha = -Infinity;
      s.root.beta = Infinity;
      s.root.alphaHistory = [-Infinity];
      s.root.betaHistory = [Infinity];
      s.currentNode = s.root;
      s.explorationPath = [s.root];
    }
  }));
};

export const runAll = () => {
  setState(produce((s) => {
    if (!s.root || s.isComplete) return;
    if (!s.currentNode) {
      s.isRunning = true;
      s.selectedNode = null;
      s.root.alpha = -Infinity;
      s.root.beta = Infinity;
      s.root.alphaHistory = [-Infinity];
      s.root.betaHistory = [Infinity];
      s.currentNode = s.root;
      s.explorationPath = [s.root];
    }
    while (s.currentNode) {
      // Save history before each step
      s.history.push(JSON.stringify({
        root: s.root.serialize(),
        currentNodePath: getNodePath(s.currentNode, s.root),
        isRunning: s.isRunning,
        explorationPath: s.explorationPath.map(n => getNodePath(n, s.root)),
      }));
      s.currentNode = s.currentNode.minimax(s.useAlphaBeta);
      s.explorationPath = buildExplorationPath(s.currentNode);
    }
    
    // After completion, compute the final optimal global path
    s.isComplete = true;
    s.isRunning = false;
    s.finalGlobalPath = computeGlobalBestPath(s.root);
    s.showGlobalPath = true; // Auto-enable global path highlight
    s.explorationPath = [];
  }));
};

export const stepBack = () => {
  setState(produce((s) => {
    if (s.history.length === 0) return;
    const { root: prevRootData, currentNodePath, isRunning, explorationPath } = JSON.parse(s.history.pop());
    s.root = Node.deserialize(prevRootData);
    s.layers = rebuildLayerCache(s.root);
    s.currentNode = findNodeByPath(currentNodePath, s.root);
    s.isRunning = isRunning;
    s.isComplete = false; // No longer complete when we step back
    s.selectedNode = null;
    // Restore exploration path if available
    if (explorationPath && Array.isArray(explorationPath)) {
      s.explorationPath = explorationPath.map((path: number[]) => findNodeByPath(path, s.root)).filter((n: Node | null) => n !== null);
    } else {
      s.explorationPath = buildExplorationPath(s.currentNode);
    }
    // Reset global path display (user can re-enable if desired)
    s.finalGlobalPath = [];
  }));
};

export const addChild = () => {
  setState(produce((s) => {
    if (!s.selectedNode) return;
    s.selectedNode.value = null;
    const newNode = new Node(s.selectedNode.layer + 1, !s.selectedNode.max, s.selectedNode);
    s.selectedNode.children.push(newNode);
    s.layers = rebuildLayerCache(s.root!);
  }));
};

export const deleteNode = () => {
  setState(produce((s) => {
    if (!s.selectedNode || !s.selectedNode.parent) return;
    const parent = s.selectedNode.parent;
    const index = parent.children.indexOf(s.selectedNode);
    if (index > -1) {
      parent.children.splice(index, 1);
      if (parent.children.length === 0) {
        parent.value = null;
      }
    }
    s.selectedNode = null;
    s.layers = rebuildLayerCache(s.root!);
  }));
};

export const updateValue = (val: number | null) => {
  setState(produce((s) => {
    if (s.selectedNode) {
      s.selectedNode.value = val;
    }
  }));
};

// Check if a node is a descendant of another (to prevent circular references)
export const isDescendant = (parent: Node, potentialDescendant: Node): boolean => {
  for (const child of parent.children) {
    if (child === potentialDescendant || isDescendant(child, potentialDescendant)) {
      return true;
    }
  }
  return false;
};

// Move a node to a new parent
export const moveNode = (node: Node, newParent: Node) => {
  setState(produce((s) => {
    if (!s.root || !node.parent) return;
    
    // Remove from old parent
    const oldParent = node.parent;
    const index = oldParent.children.indexOf(node);
    if (index > -1) {
      oldParent.children.splice(index, 1);
    }
    
    // Add to new parent
    node.parent = newParent;
    newParent.children.push(node);
    newParent.value = null; // Internal nodes have no value
    
    // Update recursively if moved to a different parent
    if (oldParent !== newParent) {
      const updateRecursive = (n: Node, layer: number, max: boolean) => {
        n.layer = layer;
        n.max = max;
        for (const child of n.children) {
          updateRecursive(child, layer + 1, !max);
        }
      };
      updateRecursive(node, newParent.layer + 1, !newParent.max);
    }
    
    // Rebuild layers
    s.layers = rebuildLayerCache(s.root);
    
    // Reset algorithm state
    s.isRunning = false;
    s.isComplete = false;
    s.currentNode = null;
    s.history = [];
    s.explorationPath = [];
    s.finalGlobalPath = [];
    s.selectedNode = null;
  }));
};

// Reorder a node among siblings
export const reorderNode = (node: Node, sibling: Node) => {
  setState(produce((s) => {
    const parent = node.parent;
    if (!parent) return;
    
    const oldIndex = parent.children.indexOf(node);
    const newIndex = parent.children.indexOf(sibling);
    
    if (oldIndex > -1 && newIndex > -1 && oldIndex !== newIndex) {
      parent.children.splice(oldIndex, 1);
      parent.children.splice(newIndex, 0, node);
      
      // Reset algorithm state
      s.isRunning = false;
      s.isComplete = false;
      s.currentNode = null;
      s.history = [];
      s.explorationPath = [];
      s.finalGlobalPath = [];
      s.selectedNode = null;
    }
  }));
};

export const setZoom = (scale: number, offset: { x: number; y: number }) => {
  setState({ scale, offset });
};

export const resetView = () => {
  setState({ scale: 1.0, offset: { x: 0, y: 0 } });
};

export const exportJSON = () => {
  if (!state.root) return;
  const data = state.root.serialize();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "alpha-beta-tree.json";
  a.click();
  URL.revokeObjectURL(url);
};

export const importJSON = (jsonString: string) => {
  try {
    const data = JSON.parse(jsonString);
    const root = Node.deserialize(data);
    setState({
      root,
      layers: rebuildLayerCache(root),
      selectedNode: null,
      currentNode: null,
      isRunning: false,
      history: [],
      scale: 1.0,
      offset: { x: 0, y: 0 },
    });
  } catch (err) {
    console.error("Failed to import JSON", err);
  }
};

export const loadImageGraph = () => {

  const root = Node.deserialize(sampleData);
  setState({
    root,
    layers: rebuildLayerCache(root),
    selectedNode: null,
    currentNode: null,
    isRunning: false,
    history: [],
    scale: 1.0,
    offset: { x: 0, y: 0 },
  });
};
