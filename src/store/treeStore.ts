import { createStore, produce } from "solid-js/store";
import { Node } from "../logic/Node";

export interface TreeState {
  root: Node | null;
  selectedNode: Node | null;
  currentNode: Node | null; // Algorithm's active node
  useAlphaBeta: boolean;
  isRunning: boolean;
  history: any[];
  scale: number;
  offset: { x: number; y: number };
  layers: Node[][];
  showHistory: boolean;
}

const initialState: TreeState = {
  root: null,
  selectedNode: null,
  currentNode: null,
  useAlphaBeta: true,
  isRunning: false,
  history: [],
  scale: 1.0,
  offset: { x: 0, y: 0 },
  layers: [],
  showHistory: false,
};

const [state, setState] = createStore<TreeState>(initialState);

// Selectors
export const useTreeState = () => state;

// Actions
export const setUseAlphaBeta = (value: boolean) => setState("useAlphaBeta", value);
export const setShowHistory = (value: boolean) => setState("showHistory", value);

export const setSelectedNode = (node: Node | null) => {
  if (state.isRunning) return;
  setState("selectedNode", node);
};

export const resetAlgorithm = () => {
  setState(produce((s) => {
    s.isRunning = false;
    s.currentNode = null;
    s.history = [];
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
      return null; // Should not happen if target is in root's tree
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

export const stepForward = () => {
  setState(produce((s) => {
    if (!s.root) return;

    // Save history
    s.history.push(JSON.stringify({
      root: s.root.serialize(),
      currentNodePath: getNodePath(s.currentNode, s.root),
      isRunning: s.isRunning,
    }));

    if (s.currentNode) {
      s.currentNode = s.currentNode.minimax(s.useAlphaBeta);
    } else {
      s.isRunning = true;
      s.selectedNode = null;
      s.root.alpha = -Infinity;
      s.root.beta = Infinity;
      s.root.alphaHistory = [-Infinity];
      s.root.betaHistory = [Infinity];
      s.currentNode = s.root;
    }
  }));
};

// export const runAll = () => {
//   setState(produce((s) => {
//     if (!s.root) return;
//     if (!s.currentNode) {
//       s.isRunning = true;
//       s.selectedNode = null;
//       s.root.alpha = -Infinity;
//       s.root.beta = Infinity;
//       s.root.alphaHistory = [-Infinity];
//       s.root.betaHistory = [Infinity];
//       s.currentNode = s.root;
//     }
//   }));
// };

export const runAll = () => {
  setState(produce((s) => {
    if (!s.root) return;
    if (!s.currentNode) {
      s.isRunning = true;
      s.selectedNode = null;
      s.root.alpha = -Infinity;
      s.root.beta = Infinity;
      s.root.alphaHistory = [-Infinity];
      s.root.betaHistory = [Infinity];
      s.currentNode = s.root;
    }
    while (s.currentNode) {
      // Save history before each step for full replayability if desired, 
      // but here we just run to the end. History is for manual stepping.
      s.history.push(JSON.stringify({
        root: s.root.serialize(),
        currentNodePath: getNodePath(s.currentNode, s.root),
        isRunning: s.isRunning,
      }));
      s.currentNode = s.currentNode.minimax(s.useAlphaBeta);
    }
  }));
};

export const stepBack = () => {
  setState(produce((s) => {
    if (s.history.length === 0) return;
    const { root: prevRootData, currentNodePath, isRunning } = JSON.parse(s.history.pop());
    s.root = Node.deserialize(prevRootData);
    s.layers = rebuildLayerCache(s.root);
    s.currentNode = findNodeByPath(currentNodePath, s.root);
    s.isRunning = isRunning;
    s.selectedNode = null;
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
  const sampleData = {
    "value": null,
    "max": true,
    "layer": 0,
    "children": [
      {
        "value": 0,
        "max": false,
        "layer": 1,
        "children": [
          {
            "value": 0,
            "max": true,
            "layer": 2,
            "children": [
              {
                "value": 0,
                "max": false,
                "layer": 3,
                "children": [
                  {
                    "value": 0,
                    "max": true,
                    "layer": 4,
                    "children": []
                  },
                  {
                    "value": 5,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": -4,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": -9,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": 5,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  }
                ]
              },
              {
                "value": null,
                "max": false,
                "layer": 3,
                "children": [
                  {
                    "value": "-inf",
                    "max": true,
                    "layer": 4,
                    "children": []
                  }
                ]
              }
            ]
          },
          {
            "value": -4,
            "max": true,
            "layer": 2,
            "children": [
              {
                "value": -4,
                "max": false,
                "layer": 3,
                "children": [
                  {
                    "value": -4,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": -4,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  },
                  {
                    "value": 1,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": 1,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": 1,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": 5,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  }
                ]
              },
              {
                "value": null,
                "max": false,
                "layer": 3,
                "children": [
                  {
                    "value": null,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": 5,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": 8,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": -12,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  },
                  {
                    "value": null,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": "inf",
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": -10,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "value": null,
        "max": false,
        "layer": 1,
        "children": [
          {
            "value": null,
            "max": true,
            "layer": 2,
            "children": [
              {
                "value": null,
                "max": false,
                "layer": 3,
                "children": [
                  {
                    "value": null,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": 7,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": -10,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": 9,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  },
                  {
                    "value": null,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": 2,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": -1,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": 1,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  }
                ]
              },
              {
                "value": null,
                "max": false,
                "layer": 3,
                "children": [
                  {
                    "value": null,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": 9,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  },
                  {
                    "value": null,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": 3,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": 7,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": -9,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": -4,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "value": null,
        "max": false,
        "layer": 1,
        "children": [
          {
            "value": null,
            "max": true,
            "layer": 2,
            "children": [
              {
                "value": "inf",
                "max": false,
                "layer": 3,
                "children": []
              },
              {
                "value": null,
                "max": false,
                "layer": 3,
                "children": [
                  {
                    "value": null,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": 3,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": 1,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": 1,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  },
                  {
                    "value": null,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": -2,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": -5,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": -7,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "value": null,
            "max": true,
            "layer": 2,
            "children": [
              {
                "value": null,
                "max": false,
                "layer": 3,
                "children": [
                  {
                    "value": 0,
                    "max": true,
                    "layer": 4,
                    "children": []
                  }
                ]
              },
              {
                "value": null,
                "max": false,
                "layer": 3,
                "children": [
                  {
                    "value": null,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": -12,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": -11,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  },
                  {
                    "value": null,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": 8,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": -4,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "value": null,
        "max": false,
        "layer": 1,
        "children": [
          {
            "value": null,
            "max": true,
            "layer": 2,
            "children": [
              {
                "value": null,
                "max": false,
                "layer": 3,
                "children": [
                  {
                    "value": null,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": -6,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  },
                  {
                    "value": null,
                    "max": true,
                    "layer": 4,
                    "children": [
                      {
                        "value": 3,
                        "max": false,
                        "layer": 5,
                        "children": []
                      },
                      {
                        "value": 1,
                        "max": false,
                        "layer": 5,
                        "children": []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

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
