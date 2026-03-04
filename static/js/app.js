/* Alpha-Beta Visualizer - Consolidated JavaScript */

console.log("Alpha-Beta Visualizer loading...");

// ===== GLOBAL VARIABLES =====
let useAlphaBeta = true; // Control variable for algorithm mode

// ===== NODE CLASS =====
function Node() {
    this.pos = [0, 0];
    this.children = [];
    this.value = null;  // Initialize as null instead of 0
    this.pruned = false;
    this.step = 0;
}

Node.prototype.setPruned = function() {
    this.pruned = true;
    for (const child of this.children) {
        child.setPruned();
    }
};

Node.prototype.serialize = function() {
    let val = this.value;
    if (this.value === Number.POSITIVE_INFINITY) val = "inf";
    if (this.value === Number.NEGATIVE_INFINITY) val = "-inf";
    
    return {
        value: val,
        max: this.max,
        layer: this.layer,
        children: this.children.map(child => child.serialize())
    };
};

Node.deserialize = function(data, parent = null) {
    const node = new Node();
    let val = data.value;
    if (val === "inf") val = Number.POSITIVE_INFINITY;
    if (val === "-inf") val = Number.NEGATIVE_INFINITY;
    
    node.value = val;
    node.max = data.max;
    node.layer = data.layer;
    node.parent = parent;
    node.children = (data.children || []).map(childData => Node.deserialize(childData, node));
    return node;
};

// Modified so algorithm can be stepped through
Node.prototype.minimax = function() {
    if (this.step == 0) {
        this.childSearchDone = false
        this.currentChildSearch = 0;
        if (this.children.length == 0) {
            if (this.parent != null) {
                this.parent.return = this.value;
            }
            if (this.parent == null) {
                return this.parent;
            }
            return this.parent.minimax();
        }
        if (this.max) {
            this.value = Number.NEGATIVE_INFINITY;
        } else {
            this.value = Number.POSITIVE_INFINITY;
        }
        this.step += 1;
    }
    if (this.step == 1) {
        if (this.currentChildSearch == this.children.length) {
            if (this.parent != null) {
                this.parent.return = this.value;
            }
            if (this.parent == null) {
                return this.parent;
            }
            return this.parent.minimax();
        }
        if (this.childSearchDone) {
            for (var i = this.currentChildSearch; i < this.children.length; i++) {
                this.children[i].setPruned();
            }
            this.currentChildSearch = this.children.length;
            return this;
        }
        var child = this.children[this.currentChildSearch];
        child.alpha = this.alpha;
        child.beta = this.beta;
        this.step += 1;
        return child;
    } else if (this.step == 2) {
        var childValue = this.return
        if (this.max) {
            this.value = Math.max(this.value, childValue);
            if (useAlphaBeta) {
                this.alpha = Math.max(this.alpha, childValue);
            }
        } else {
            this.value = Math.min(this.value, childValue);
            if (useAlphaBeta) {
                this.beta = Math.min(this.beta, childValue);
            }
        }
        // Only prune if alpha-beta is enabled
        if (useAlphaBeta && this.beta <= this.alpha) {
            this.childSearchDone = true;
        }
        this.currentChildSearch += 1;
        this.step -= 1;
        return this;
    }
};

Node.prototype.draw = function(ctx) {
    var blackValue = "#000000";
    if (this.pruned) {
        blackValue = "#bbbbbb";
    }
    for (const node of this.children) {
        ctx.lineWidth = Math.max(1, parseInt(Node.radius / 25));
        if (node.pruned) {
            ctx.strokeStyle = "#bbbbbb";
        } else {
            ctx.strokeStyle = "#000000";
        }
        ctx.beginPath();
        ctx.moveTo(this.pos[0], this.pos[1] + Node.radius - 1);
        ctx.lineTo(node.pos[0], node.pos[1] - Node.radius + 1);
        ctx.stroke();
        node.draw(ctx);
    }
    ctx.font = Node.radius + "px Helvetica";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.beginPath();
    ctx.arc(this.pos[0], this.pos[1], Node.radius, 0, 2 * Math.PI);
    
    if (this.pruned) {
        // Pruned nodes - gray
        ctx.fillStyle = "#9e9e9e"; // Gray color for pruned nodes
        ctx.fill();
        ctx.lineWidth = Math.max(1, parseInt(Node.radius / 10));
        ctx.strokeStyle = "#757575"; // Darker gray for border
        ctx.stroke();
        ctx.fillStyle = "#ffffff"; // White text
    } else if (this.max) {
        // MAX nodes - green
        ctx.fillStyle = "#28a745"; // Bootstrap success green
        ctx.fill();
        ctx.lineWidth = Math.max(1, parseInt(Node.radius / 10));
        ctx.strokeStyle = "#1e7e34"; // Darker green for border
        ctx.stroke();
        ctx.fillStyle = "#ffffff"; // White text
    } else {
        // MIN nodes - red
        ctx.fillStyle = "#dc3545"; // Bootstrap danger red
        ctx.fill();
        ctx.lineWidth = Math.max(1, parseInt(Node.radius / 10));
        ctx.strokeStyle = "#bd2130"; // Darker red for border
        ctx.stroke();
        ctx.fillStyle = "#ffffff"; // White text
    }
    if (this.value != null) {
        var valueText = this.value;
        if (this.value === Number.POSITIVE_INFINITY) valueText = "inf";
        if (this.value === Number.NEGATIVE_INFINITY) valueText = "-inf";
        ctx.fillText(valueText, this.pos[0], this.pos[1] + Node.radius / 15);
    }

    if (this.children.length == 0) {
        return;
    }

    ctx.font = "bold " + Node.radius / 1.8 + "px Helvetica";
    
    // Set text color based on pruned status
    if (this.pruned) {
        ctx.fillStyle = "#9e9e9e"; // Gray for pruned nodes
    } else {
        ctx.fillStyle = "#0000ff"; // Blue for normal nodes
    }

    // Only show alpha and beta values when alpha-beta mode is enabled
    if (useAlphaBeta) {
        var alphaText = "α: ";
        if (this.alpha == Number.POSITIVE_INFINITY) {
            alphaText += "Inf";
        } else if (this.alpha == Number.NEGATIVE_INFINITY) {
            alphaText += "-Inf";
        } else if (this.alpha == null){
            alphaText = "";
        } else {
            alphaText += this.alpha;
        }
        ctx.fillText(alphaText, this.pos[0], this.pos[1] - Node.radius * 2.5);
        
        var betaText = "β: ";
        if (this.beta == Number.POSITIVE_INFINITY) {
            betaText += "Inf";
        } else if (this.beta == Number.NEGATIVE_INFINITY) {
            betaText += "-Inf";
        } else if (this.beta == null){
            betaText = "";
        } else {
            betaText += this.beta;
        }
        ctx.fillText(betaText, this.pos[0], this.pos[1] - Node.radius * 1.8);
    }
};

// Method to detect if a click position is within this node or its children
Node.prototype.getNodeAtPosition = function(x, y) {
    // Check children recursively first (reverse order to pick top-most nodes)
    for (var i = this.children.length - 1; i >= 0; i--) {
        var childResult = this.children[i].getNodeAtPosition(x, y);
        if (childResult != null) {
            return childResult;
        }
    }

    // Check if click is within this node's circle
    var dx = x - this.pos[0];
    var dy = y - this.pos[1];
    var distance = Math.sqrt(dx * dx + dy * dy);
    
    // Add a small 20% "forgiveness" margin to the radius for easier clicking
    if (distance <= Node.radius * 1.2) {
        return this;
    }
    
    return null;
};

Node.radius = 0;

// ===== CONTROLS MANAGER =====
function setSelectedNode(node, isRoot) {
    var unselectedInfo = document.getElementById("unselectedInfo");
    var nodeInfo = document.getElementById("nodeInfo");
    var deleteButton = document.getElementById("deleteNode");
    var runningInfo = document.getElementById("runningInfo");
    var nodeTypeText = document.getElementById("nodeTypeText");
    var nodeValueInput = document.getElementById("nodeValueInput");
    var nodeValueContainer = document.getElementById("nodeValueContainer");
    
    // Check if elements exist before manipulating them
    if (!unselectedInfo || !nodeInfo || !runningInfo) {
        console.warn("Some control elements not found in DOM");
        return;
    }
    
    if (node == -1) {
        unselectedInfo.classList.add("d-none");
        runningInfo.classList.remove("d-none");
        nodeInfo.classList.add("d-none");
        return;
    }
    
    if (node == null) {
        runningInfo.classList.add("d-none");
        unselectedInfo.classList.remove("d-none");
        nodeInfo.classList.add("d-none"); 
    } else {
        runningInfo.classList.add("d-none");
        unselectedInfo.classList.add("d-none"); 
        nodeInfo.classList.remove("d-none");
        
        // Update node information in sidebar
        if (nodeTypeText) {
            const nodeType = node.max ? "Maximizer Node" : "Minimizer Node";
            const icon = node.max ? '<i class="fas fa-caret-up text-success me-1"></i>' : '<i class="fas fa-caret-down text-danger me-1"></i>';
            nodeTypeText.innerHTML = `${icon}Type: ${nodeType}`;
        }

        if (nodeValueInput && nodeValueContainer) {
            if (node.children.length === 0) {
                nodeValueContainer.classList.remove("d-none");
                let valText = node.value;
                if (node.value === Number.POSITIVE_INFINITY) valText = "inf";
                if (node.value === Number.NEGATIVE_INFINITY) valText = "-inf";
                nodeValueInput.value = valText !== null ? valText : "";
                
                // Optional: Auto-focus the input when a leaf is selected
                setTimeout(() => nodeValueInput.focus(), 50);
            } else {
                nodeValueContainer.classList.add("d-none");
            }
        }
    }
    
    // Handle delete button visibility
    if (deleteButton) {
        if (isRoot) {
            deleteButton.classList.add("d-none");
        } else {
            deleteButton.classList.remove("d-none");
        }
    }
}

// ===== NODE MANAGER =====
function NodeManager(canvasID) {
    console.log("Initializing NodeManager with canvas ID:", canvasID);
    
    this.canvas = document.getElementById(canvasID);
    if (!this.canvas) {
        console.error(`Canvas element with ID '${canvasID}' not found`);
        return;
    }
    
    console.log("Canvas found:", this.canvas);
    
    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) {
        console.error("Unable to get 2D context from canvas");
        return;
    }
    
    console.log("Canvas context obtained successfully");
    
    // Initialize canvas size responsively
    this.resizeCanvas();
    
    console.log(`Canvas initialized with size: ${this.canvas.width}x${this.canvas.height}`);
    
    this.nodes = [];
    this.selected = null;
    this.bottomLayerCount = null;
    this.currentNode = null;
    this.history = [];  // Array para almacenar el historial de estados
    this.isDragging = false;
    this.dragNode = null;
    this.hoverNode = null;
    this.mousePos = { x: 0, y: 0 };
    
    // Zoom and Pan state
    this.scale = 1.0;
    this.offset = { x: 0, y: 0 };
    this.isPanning = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.isSpacePressed = false;

    window.addEventListener("resize", () => {
        // Resize canvas and redraw on window resize
        this.resizeCanvas();
        setTimeout(() => this.draw(), 100);
    });
    
    window.addEventListener("keydown", (e) => {
        // Don't trigger shortcuts if user is typing in an input field
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

        if (e.code === "Space") {
            this.isSpacePressed = true;
            if (!this.isDragging) this.canvas.style.cursor = "grab";
        } else if (e.code === "ArrowRight") {
            this.step();
        } else if (e.code === "ArrowLeft") {
            this.stepBack();
        } else if (e.code === "KeyR") {
            this.reset();
        }
    });
    
    window.addEventListener("keyup", (e) => {
        if (e.code === "Space") {
            this.isSpacePressed = false;
            if (!this.isPanning) this.canvas.style.cursor = "crosshair";
        }
    });

    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.canvas.addEventListener("wheel", this.onWheel.bind(this), { passive: false });
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    
    document.getElementById("run").addEventListener("click", this.run.bind(this));
    document.getElementById("step").addEventListener("click", this.step.bind(this));
    document.getElementById("stepBack").addEventListener("click", this.stepBack.bind(this));
    document.getElementById("reset").addEventListener("click", this.reset.bind(this));

    document.getElementById("addChild").addEventListener("click", this.addChild.bind(this));
    document.getElementById("deleteNode").addEventListener("click", this.deleteNode.bind(this));
    document.getElementById("generateTree").addEventListener("click", this.generateRandomTree.bind(this));
    document.getElementById("loadImageGraph").addEventListener("click", this.loadImageGraph.bind(this));
    document.getElementById("resetView").addEventListener("click", () => {
        this.scale = 1.0;
        this.offset = { x: 0, y: 0 };
        this.draw();
    });
    
    // Save & Load listeners
    document.getElementById("exportJSON").addEventListener("click", this.exportJSON.bind(this));
    const importInput = document.getElementById("importJSONInput");
    document.getElementById("importJSONBtn").addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", this.importJSON.bind(this));
    
    // Node Value sidebar listeners
    const valInput = document.getElementById("nodeValueInput");
    valInput.addEventListener("input", (e) => this.updateNodeValue(e.target.value));
    document.getElementById("setInfBtn").addEventListener("click", () => {
        valInput.value = "inf";
        this.updateNodeValue("inf");
    });
    document.getElementById("setNegInfBtn").addEventListener("click", () => {
        valInput.value = "-inf";
        this.updateNodeValue("-inf");
    });

    // Alpha-Beta toggle event listener
    document.getElementById("alphaBetaToggle").addEventListener("change", this.toggleAlphaBeta.bind(this));
    
    // Make node_manager globally accessible for debugging
    window.nodeManager = this;
}

NodeManager.prototype.getTransformedPoint = function(x, y) {
    return {
        x: (x - this.offset.x) / this.scale,
        y: (y - this.offset.y) / this.scale
    };
};

NodeManager.prototype.onWheel = function(event) {
    event.preventDefault();
    
    const zoomSpeed = 0.1;
    const zoomFactor = event.deltaY > 0 ? (1 - zoomSpeed) : (1 + zoomSpeed);
    
    const oldScale = this.scale;
    this.scale *= zoomFactor;
    
    // Clamp zoom scale
    this.scale = Math.max(0.1, Math.min(this.scale, 5.0));
    
    const realZoomFactor = this.scale / oldScale;
    
    // Zoom around mouse position
    this.offset.x = event.offsetX - (event.offsetX - this.offset.x) * realZoomFactor;
    this.offset.y = event.offsetY - (event.offsetY - this.offset.y) * realZoomFactor;
    
    this.draw();
};

// Canvas resize handler
NodeManager.prototype.resizeCanvas = function() {
    const container = this.canvas.parentElement;
    if (container) {
        // Get container dimensions
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width - 20; // Leave some padding
        const containerHeight = containerRect.height - 20; // Leave some padding
        
        // Set minimum dimensions
        const minWidth = 600;
        const minHeight = 400;
        
        // Calculate canvas dimensions
        this.canvas.width = Math.max(containerWidth, minWidth);
        this.canvas.height = Math.max(containerHeight, minHeight);
        
        console.log(`Canvas resized to: ${this.canvas.width}x${this.canvas.height}`);
    }
};

// Sistema de notificaciones
NodeManager.prototype.showNotification = function(message, type = 'info') {
    // Remover notificación existente si hay una
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Ocultar notificación después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
};

// Helper to update selected node value from sidebar
NodeManager.prototype.updateNodeValue = function(rawVal) {
    if (!this.selected || this.selected === -1) return;
    
    let val = rawVal.toLowerCase().trim();
    let numericVal = null;

    if (val === "inf" || val === "infinity" || val === "i" || val === "+inf") {
        numericVal = Number.POSITIVE_INFINITY;
    } else if (val === "-inf" || val === "-infinity" || val === "-i") {
        numericVal = Number.NEGATIVE_INFINITY;
    } else if (val !== "") {
        numericVal = parseInt(val);
        if (isNaN(numericVal)) numericVal = null;
    }

    this.selected.value = numericVal;
    
    // Reset algorithm state as tree values changed
    this.reset();
    this.draw();
};

NodeManager.prototype.reset = function() {
    if (this.selected != -1) {
        return;
    }
    this.selected = null;
    this.currentNode = null;
    this.history = [];  // Limpiar historial
    for (const nodeLayer of this.nodes) {
        for (const node of nodeLayer) {
            node.pruned = false;
            node.step = 0;
            node.alpha = null;
            node.beta = null;
            if (node.children.length != 0) {
                node.value = null;
            }
        }
    }
    setSelectedNode(this.selected, this.selected == this.nodes[0][0]);
    this.draw();
};

NodeManager.prototype.saveState = function() {
    var state = {
        currentNode: this.currentNode,
        selected: this.selected,
        nodes: []
    };
    
    // Guardar estado de todos los nodos
    for (const nodeLayer of this.nodes) {
        var layerState = [];
        for (const node of nodeLayer) {
            layerState.push({
                pruned: node.pruned,
                step: node.step,
                alpha: node.alpha,
                beta: node.beta,
                value: node.value,
                childSearchDone: node.childSearchDone,
                currentChildSearch: node.currentChildSearch
            });
        }
        state.nodes.push(layerState);
    }
    
    this.history.push(state);
};

NodeManager.prototype.restoreState = function(state) {
    this.currentNode = state.currentNode;
    this.selected = state.selected;
    
    // Restaurar estado de todos los nodos
    for (var i = 0; i < this.nodes.length; i++) {
        for (var j = 0; j < this.nodes[i].length; j++) {
            var node = this.nodes[i][j];
            var nodeState = state.nodes[i][j];
            node.pruned = nodeState.pruned;
            node.step = nodeState.step;
            node.alpha = nodeState.alpha;
            node.beta = nodeState.beta;
            node.value = nodeState.value;
            node.childSearchDone = nodeState.childSearchDone;
            node.currentChildSearch = nodeState.currentChildSearch;
        }
    }
    
    // Actualizar la interfaz según el estado seleccionado
    setSelectedNode(this.selected, this.selected == this.nodes[0][0]);
};

NodeManager.prototype.stepBack = function() {
    if (this.history.length > 0) {
        var previousState = this.history.pop();
        this.restoreState(previousState);
        this.draw();
    }
};

NodeManager.prototype.step = function() {
    // Guardar estado antes del paso
    this.saveState();
    
    if (this.currentNode != null) {
        this.currentNode = this.currentNode.minimax();
    } else if (this.selected != -1) {
        // Inicializar algoritmo alpha-beta
        this.selected = -1;
        setSelectedNode(this.selected, this.selected == this.nodes[0][0]);
        this.nodes[0][0].alpha = Number.NEGATIVE_INFINITY;
        this.nodes[0][0].beta = Number.POSITIVE_INFINITY;
        this.currentNode = this.nodes[0][0];
    } else {
        // Si selected es null, también inicializar
        this.selected = -1;
        setSelectedNode(this.selected, this.selected == this.nodes[0][0]);
        this.nodes[0][0].alpha = Number.NEGATIVE_INFINITY;
        this.nodes[0][0].beta = Number.POSITIVE_INFINITY;
        this.currentNode = this.nodes[0][0];
    }
    this.draw();
}

NodeManager.prototype.run = function() {
    if (this.selected != -1) {
        this.selected = -1;
        setSelectedNode(this.selected, this.selected == this.nodes[0][0]);
        this.nodes[0][0].alpha = Number.NEGATIVE_INFINITY;
        this.nodes[0][0].beta = Number.POSITIVE_INFINITY;
        this.currentNode = this.nodes[0][0];
    }
    while (this.currentNode != null) {
        this.currentNode = this.currentNode.minimax();
    }
    this.draw();
};

NodeManager.prototype.addChild = function() {
    if (this.selected == null) {
        return;
    }
    this.selected.value = null;
    var newNode = new Node();
    newNode.layer = this.selected.layer + 1;
    newNode.max = !this.selected.max;
    newNode.parent = this.selected;
    this.selected.children.push(newNode);
    if (newNode.layer == this.nodes.length) {
        this.nodes.push([]);
    }
    this.nodes[newNode.layer].push(newNode);
    this.bottomLayerCount = null;
    setSelectedNode(this.selected, this.selected == this.nodes[0][0]);
    this.draw();
};

NodeManager.prototype.generateRandomTree = function() {
    // Siempre generar 4 niveles (5 capas total)
    const numLayers = 3;
    const totalLayers = numLayers + 1;
    
    // Limpiar árbol actual y resetear estado del algoritmo
    this.nodes = [];
    this.selected = null;
    this.currentNode = null;
    this.history = [];
    this.bottomLayerCount = null;
    
    // Crear nodo raíz
    var rootNode = new Node();
    rootNode.layer = 0;
    rootNode.max = true;
    rootNode.parent = null;
    this.nodes.push([rootNode]);
    
    // Generar árbol capa por capa
    for (let layer = 0; layer < totalLayers - 1; layer++) {
        const currentLayerNodes = this.nodes[layer];
        const nextLayer = [];
        
        for (const node of currentLayerNodes) {
            // Número de hijos basado en la capa para crear un árbol más interesante
            let numChildren;
            if (layer === 0) {
                numChildren = Math.floor(Math.random() * 2) + 2; // Raíz: 2-3 hijos
            } else if (layer === totalLayers - 2) {
                numChildren = Math.floor(Math.random() * 3) + 2; // Penúltima capa: 2-4 hijos
            } else {
                numChildren = Math.floor(Math.random() * 2) + 2; // Otras capas: 2-3 hijos
            }
            
            for (let i = 0; i < numChildren; i++) {
                var childNode = new Node();
                childNode.layer = layer + 1;
                childNode.max = !node.max; // Alternar entre max y min
                childNode.parent = node;
                
                // Si es la última capa (nodos hoja), asignar valor aleatorio
                if (layer + 1 === totalLayers - 1) {
                    // Generar valores más variados para hacer el algoritmo más interesante
                    const randomValue = Math.floor(Math.random() * 41) - 20; // Rango -20 a 20
                    childNode.value = randomValue;
                } else {
                    childNode.value = null; // Nodos internos no tienen valor inicial
                }
                
                node.children.push(childNode);
                nextLayer.push(childNode);
            }
        }
        
        if (nextLayer.length > 0) {
            this.nodes.push(nextLayer);
        }
    }
    
    // Actualizar interfaz
    this.scale = 1.0;
    this.offset = { x: 0, y: 0 };
    setSelectedNode(null, false);
    this.resizeCanvas();
    this.draw();
    
    console.log(`Tree generated with ${totalLayers} layers (user requested ${numLayers}) and ${this.nodes[this.nodes.length - 1].length} leaf nodes`);
};

NodeManager.prototype.loadImageGraph = function() {
    const jsonData = [
        [
            {
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
                  "value": Number.NEGATIVE_INFINITY,
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
                      "value": Number.POSITIVE_INFINITY,
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
              "value": Number.POSITIVE_INFINITY,
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
}
        ]
    ];

    const rootData = jsonData[0][0];
    
    this.nodes = [];
    this.selected = null;
    this.currentNode = null;
    this.history = [];
    this.bottomLayerCount = null;

    const build = (data, layer, max, parent) => {
        const node = new Node();
        node.value = data.value;
        node.layer = layer;
        node.max = max;
        node.parent = parent;
        if (!this.nodes[layer]) this.nodes[layer] = [];
        this.nodes[layer].push(node);
        if (parent) parent.children.push(node);
        
        if (data.children && data.children.length > 0) {
            data.children.forEach(c => build(c, layer + 1, !max, node));
        }
        return node;
    };

    build(rootData, 0, true, null);
    this.scale = 1.0;
    this.offset = { x: 0, y: 0 };
    this.resizeCanvas();
    this.draw();
};


NodeManager.prototype.deleteNode = function() {
    if (this.selected == null || this.selected.layer == 0) {
        return;
    }
    var nodeStack = [this.selected];
    while (nodeStack.length != 0) {
        var node = nodeStack.pop();
        for (var i = 0; i < this.nodes[node.layer].length; i++) {
            if (this.nodes[node.layer][i] == node) {
                this.nodes[node.layer].splice(i, 1);
                break;
            }
        }
        for (const child of node.children.slice().reverse()) {
            nodeStack.push(child);
        }
    }
    for (var i = this.nodes.length - 1; i >= 0; i--) {
        if (this.nodes[i].length == 0) {
            this.nodes.splice(i, 1);
        }
    }
    var done = false;
    for (const node of this.nodes[this.selected.layer - 1]) {
        for (var i = 0; i < node.children.length; i++) {
            if (node.children[i] == this.selected) {
                node.children.splice(i, 1);
                if (node.children.length == 0) {
                    node.value = null;
                }
                done = true;
                break;
            }
        }
        if (done) {
            break;
        }
    }
    this.selected = null;
    setSelectedNode(this.selected, this.selected == this.nodes[0][0]);
    this.bottomLayerCount = null;
    this.draw();
};

NodeManager.prototype.onMouseDown = function(event) {
    const transformed = this.getTransformedPoint(event.offsetX, event.offsetY);
    
    // Always allow panning with middle click (button 1), right click (button 2) or left click (button 0) + Space
    const isPanModifier = event.button === 1 || event.button === 2 || (event.button === 0 && this.isSpacePressed);
    
    if (isPanModifier) {
        this.isPanning = true;
        this.lastMousePos = { x: event.offsetX, y: event.offsetY };
        this.canvas.style.cursor = "grabbing";
        return;
    }

    if (this.selected == -1) {
        return;
    }
    
    var clickedNode = null;
    if (this.nodes.length > 0 && this.nodes[0][0]) {
        clickedNode = this.nodes[0][0].getNodeAtPosition(transformed.x, transformed.y);
    }
    
    if (clickedNode) {
        this.selected = clickedNode;
        // Don't allow dragging the root node
        if (clickedNode.layer !== 0) {
            this.isDragging = true;
            this.dragNode = clickedNode;
            this.canvas.classList.add("dragging");
        }
    } else {
        this.selected = null;
        // Start panning with left click on background
        this.isPanning = true;
        this.lastMousePos = { x: event.offsetX, y: event.offsetY };
        this.canvas.style.cursor = "grabbing";
    }
    
    setSelectedNode(this.selected, this.selected == (this.nodes.length > 0 ? this.nodes[0][0] : null));
    this.draw();
};

NodeManager.prototype.onMouseMove = function(event) {
    const transformed = this.getTransformedPoint(event.offsetX, event.offsetY);
    this.mousePos = transformed;
    
    if (this.isDragging) {
        // Auto-panning when dragging near canvas edges
        const margin = 50;
        const panSpeed = 8;
        let needsRedraw = false;
        
        if (event.offsetX < margin) { this.offset.x += panSpeed; needsRedraw = true; }
        if (event.offsetX > this.canvas.width - margin) { this.offset.x -= panSpeed; needsRedraw = true; }
        if (event.offsetY < margin) { this.offset.y += panSpeed; needsRedraw = true; }
        if (event.offsetY > this.canvas.height - margin) { this.offset.y -= panSpeed; needsRedraw = true; }

        // Find potential parent or sibling
        this.hoverNode = this.nodes[0][0].getNodeAtPosition(transformed.x, transformed.y);
        
        // Validate target
        if (this.hoverNode) {
            // Cannot drop on self or descendants
            if (this.hoverNode === this.dragNode || this.isDescendant(this.dragNode, this.hoverNode)) {
                this.hoverNode = null;
            }
        }
        this.draw();
    } else if (this.isPanning) {
        this.offset.x += event.offsetX - this.lastMousePos.x;
        this.offset.y += event.offsetY - this.lastMousePos.y;
        this.lastMousePos = { x: event.offsetX, y: event.offsetY };
        this.draw();
    } else {
        // Check for node hover to show pointer cursor
        var hoveredNode = null;
        if (this.nodes.length > 0 && this.nodes[0][0]) {
            hoveredNode = this.nodes[0][0].getNodeAtPosition(transformed.x, transformed.y);
        }
        
        if (this.isSpacePressed) {
            this.canvas.style.cursor = "grab";
        } else {
            this.canvas.style.cursor = hoveredNode ? "pointer" : "crosshair";
        }
    }
};

NodeManager.prototype.onMouseUp = function(event) {
    if (this.isDragging) {
        if (this.hoverNode) {
            if (this.hoverNode.parent === this.dragNode.parent && this.hoverNode !== this.dragNode.parent) {
                // It's a sibling! Reorder.
                this.reorderNode(this.dragNode, this.hoverNode);
            } else {
                // It's a new parent (or current parent)
                this.moveNode(this.dragNode, this.hoverNode);
            }
        }
        
        this.isDragging = false;
        this.dragNode = null;
        this.hoverNode = null;
        this.canvas.classList.remove("dragging");
        this.draw();
    } else if (this.isPanning) {
        this.isPanning = false;
    }
    
    // Finalize cursor based on spacebar state
    if (this.isSpacePressed) {
        this.canvas.style.cursor = "grab";
    } else {
        // We'll re-evaluate the cursor in onMouseMove if needed, but crosshair is default
        this.canvas.style.cursor = "crosshair";
    }
};

NodeManager.prototype.reorderNode = function(node, sibling) {
    const parent = node.parent;
    if (!parent) return;

    const oldIndex = parent.children.indexOf(node);
    const newIndex = parent.children.indexOf(sibling);

    if (oldIndex > -1 && newIndex > -1) {
        parent.children.splice(oldIndex, 1);
        parent.children.splice(newIndex, 0, node);
        
        // Reset algorithm state and redraw
        this.reset();
        this.draw();
        this.showNotification("Nodes reorganized!", "success");
    }
};

NodeManager.prototype.isDescendant = function(parent, potentialDescendant) {
    for (const child of parent.children) {
        if (child === potentialDescendant || this.isDescendant(child, potentialDescendant)) {
            return true;
        }
    }
    return false;
};

NodeManager.prototype.moveNode = function(node, newParent) {
    // 1. Remove from old parent
    const oldParent = node.parent;
    if (oldParent) {
        const index = oldParent.children.indexOf(node);
        if (index > -1) {
            oldParent.children.splice(index, 1);
        }
    }

    // 2. Add to new parent (or re-add to same parent at the end)
    node.parent = newParent;
    newParent.children.push(node);
    newParent.value = null; // Internal nodes have no value

    // 3. Update recursively if moved to a different parent
    if (oldParent !== newParent) {
        const updateRecursive = (n, layer, max) => {
            n.layer = layer;
            n.max = max;
            for (const child of n.children) {
                updateRecursive(child, layer + 1, !max);
            }
        };
        updateRecursive(node, newParent.layer + 1, !newParent.max);
    }

    // 4. Reset algorithm state and rebuild cache
    this.reset();
    this.rebuildLayerCache();
    this.bottomLayerCount = null;
    this.showNotification("Node moved successfully!", "success");
};

NodeManager.prototype.exportJSON = function() {
    if (this.nodes.length === 0 || !this.nodes[0][0]) {
        this.showNotification("No tree to export", "error");
        return;
    }
    const data = this.nodes[0][0].serialize();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alpha-beta-tree.json";
    a.click();
    URL.revokeObjectURL(url);
    this.showNotification("Tree exported successfully", "success");
};

NodeManager.prototype.importJSON = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const root = Node.deserialize(data);
            
            // Clear current state
            this.nodes = [];
            this.selected = null;
            this.currentNode = null;
            this.history = [];
            this.bottomLayerCount = null;
            
            // Rebuild cache
            const traverse = (node) => {
                if (!this.nodes[node.layer]) this.nodes[node.layer] = [];
                this.nodes[node.layer].push(node);
                node.children.forEach(traverse);
            };
            traverse(root);
            
            this.scale = 1.0;
            this.offset = { x: 0, y: 0 };
            this.resizeCanvas();
            this.draw();
            this.showNotification("Tree imported successfully", "success");
        } catch (err) {
            console.error(err);
            this.showNotification("Error importing JSON", "error");
        }
    };
    reader.readAsText(file);
    // Reset input so the same file can be uploaded again
    event.target.value = "";
};

NodeManager.prototype.rebuildLayerCache = function() {
    const root = this.nodes[0][0];
    this.nodes = [];
    
    const traverse = (node) => {
        if (!this.nodes[node.layer]) {
            this.nodes[node.layer] = [];
        }
        this.nodes[node.layer].push(node);
        for (const child of node.children) {
            traverse(child);
        }
    };
    traverse(root);
};

NodeManager.prototype.setNodeRadius = function() {
    if (this.bottomLayerCount == null) {
        this.bottomLayerCount = 0;
        var nodeStack = [this.nodes[0][0]];
        while (nodeStack.length != 0) {
            var node = nodeStack.pop();
            if (node.children.length == 0) {
                this.bottomLayerCount += 1;
            } else {
                for (const child of node.children.slice().reverse()) {
                    nodeStack.push(child);
                }
            }
        }
    }
    var xDiam = this.canvas.width / (0.5 + 1.5 * this.bottomLayerCount);
    var yDiam = this.canvas.height / (1 + 2 * this.nodes.length);
    Node.radius = Math.min(xDiam, yDiam) / 2;
};

NodeManager.prototype.setNodePositions = function() {
    var xOffset = (this.canvas.width - Node.radius * (1 + 3 * this.bottomLayerCount)) / 2;
    var yOffset = (this.canvas.height - Node.radius * (1 + 4 * this.nodes.length)) / 2;
    var count = 2;
    var nodeStack = [this.nodes[0][0]];
    while (nodeStack.length != 0) {
        var node = nodeStack.pop();
        if (node.children.length == 0) {
            node.pos[0] = xOffset + count * Node.radius;
            node.pos[1] = yOffset + (2 + 4 * node.layer) * Node.radius;
            count += 3;
        } else {
            for (const child of node.children.slice().reverse()) {
                nodeStack.push(child);
            }
        }
    }
    for (const nodeLayer of this.nodes.slice(0, -1).reverse()) {
        for (const node of nodeLayer) {
            if (node.children.length != 0) {
                node.pos[0] = (node.children[0].pos[0] + node.children[node.children.length - 1].pos[0]) / 2;
                node.pos[1] = yOffset + (2 + 4 * node.layer) * Node.radius;
            }
        }
    }
};

NodeManager.prototype.draw = function() {
    console.log("Draw method called. Nodes:", this.nodes.length > 0 ? "Has nodes" : "No nodes");
    
    // Check if canvas is valid before proceeding
    if (!this.canvas || !this.ctx) {
        console.error("Canvas or context not available for drawing");
        return;
    }
    
    try {
        // Simple canvas sizing
        if (this.canvas.width <= 0 || this.canvas.height <= 0) {
            this.canvas.width = 800;
            this.canvas.height = 600;
            console.log("Reset canvas to default size");
        }
        
        this.setNodeRadius();
        this.setNodePositions();
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save state and apply transformations
        this.ctx.save();
        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.scale, this.scale);
        
        if (this.nodes.length > 0 && this.nodes[0].length > 0) {
            this.nodes[0][0].draw(this.ctx);
        } else {
            // Restore context before drawing the placeholder to avoid it being transformed
            this.ctx.restore();
            
            console.warn("No nodes to draw - drawing placeholder");
            // Draw a placeholder message
            this.ctx.fillStyle = "#495057";
            this.ctx.font = "24px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText("🌳 Click 'Generate Random Tree' to start", this.canvas.width/2, this.canvas.height/2 - 20);
            
            this.ctx.fillStyle = "#6c757d";
            this.ctx.font = "16px Arial";
            this.ctx.fillText("The tree will appear here once generated", this.canvas.width/2, this.canvas.height/2 + 20);
            
            // Re-save context to stay consistent with the rest of the method
            this.ctx.save();
            this.ctx.translate(this.offset.x, this.offset.y);
            this.ctx.scale(this.scale, this.scale);
        }
        
        var highlight = this.selected;
        if (this.currentNode != null) {
            highlight = this.currentNode;
        }
        if (highlight != null && highlight != -1) {
            // Mejorar la visualización del nodo destacado
            this.ctx.save();
            this.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            this.ctx.shadowBlur = 15;
            this.ctx.lineWidth = Math.max(3, parseInt(Node.radius / 8));
            this.ctx.strokeStyle = "#343a40";
            this.ctx.beginPath();
            this.ctx.arc(highlight.pos[0], highlight.pos[1], Node.radius + 5, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Visual feedback for dragging
        if (this.isDragging && this.dragNode) {
            this.ctx.save();
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.dragNode.pos[0], this.dragNode.pos[1]);
            this.ctx.lineTo(this.mousePos.x, this.mousePos.y);
            this.ctx.stroke();

            // Target highlight
            if (this.hoverNode) {
                this.ctx.beginPath();
                this.ctx.arc(this.hoverNode.pos[0], this.hoverNode.pos[1], Node.radius + 8, 0, 2 * Math.PI);
                
                // Highlight color based on action
                if (this.hoverNode.parent === this.dragNode.parent && this.hoverNode !== this.dragNode.parent) {
                    // Sibling reorganization highlight (Blue)
                    this.ctx.fillStyle = "rgba(0, 123, 255, 0.3)";
                    this.ctx.strokeStyle = "#007bff";
                } else {
                    // Parent movement highlight (Green)
                    this.ctx.fillStyle = "rgba(40, 167, 69, 0.3)";
                    this.ctx.strokeStyle = "#28a745";
                }
                
                this.ctx.fill();
                this.ctx.setLineDash([]);
                this.ctx.stroke();
            }
            this.ctx.restore();
        }
        
        // Restore transformations
        this.ctx.restore();
        
    } catch (error) {
        console.error("Error in draw method:", error);
    }
};

NodeManager.prototype.toggleAlphaBeta = function() {
    const toggle = document.getElementById('alphaBetaToggle');
    const label = document.getElementById('toggleLabel');
    const description = document.getElementById('toggleDescription');
    
    useAlphaBeta = toggle.checked;
    
    if (useAlphaBeta) {
        label.innerHTML = '<i class="fas fa-cut me-2"></i>Alpha-Beta Pruning';
        description.textContent = 'Optimized algorithm with alpha-beta pruning';
    } else {
        label.innerHTML = '<i class="fas fa-tree me-2"></i>Pure Minimax';
        description.textContent = 'Minimax algorithm without optimizations';
    }
    
    // Reset the tree state when changing algorithm mode
    this.reset();
    
    // Redraw to update the display immediately
    this.draw();
    
    console.log(`Algorithm mode changed to: ${useAlphaBeta ? 'Alpha-Beta' : 'Pure Minimax'}`);
};

// ===== MAIN APPLICATION =====
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing application...");
    
    try {
        // Initialize the node manager
        console.log("Creating NodeManager...");
        var node_manager = new NodeManager("canvas");
        
        if (!node_manager || !node_manager.canvas) {
            console.error("Failed to initialize NodeManager - canvas not found");
            return;
        }
        
        console.log("NodeManager created successfully");

        // Sidebar collapsible toggle
        const sidebarToggle = document.getElementById("sidebarToggle");
        const sidebar = document.getElementById("sidebar");

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener("click", function() {
                sidebar.classList.toggle("collapsed");
                
                // Redraw canvas after transition
                setTimeout(() => {
                    node_manager.resizeCanvas();
                    node_manager.draw();
                }, 305); // slightly more than transition duration
            });
        }
        
        // Generate a default tree with proper values
        console.log("Generating default tree...");
        node_manager.generateRandomTree();
        
        // Initialize Bootstrap tooltips
        console.log("Initializing tooltips...");
        if (typeof bootstrap !== 'undefined') {
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
        
        console.log("Application initialized successfully");
        
        // Make node_manager globally accessible for debugging
        window.nodeManager = node_manager;
        
    } catch (error) {
        console.error("Error during initialization:", error);
    }
});
