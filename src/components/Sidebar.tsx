import { Show, type Component } from "solid-js";
import { 
  useTreeState, 
  setUseAlphaBeta, 
  setShowHistory,
  runAll, 
  stepForward, 
  stepBack, 
  resetAlgorithm, 
  generateRandomTree, 
  resetView, 
  addChild, 
  deleteNode, 
  updateValue,
  exportJSON,
  importJSON,
  loadImageGraph
} from "../store/treeStore";

export const Sidebar: Component = () => {
  const state = useTreeState();
  let fileInputRef: HTMLInputElement | undefined;

  const handleValueChange = (val: string) => {
    let numVal: number | null = null;
    const lower = val.toLowerCase().trim();
    if (lower === "inf" || lower === "infinity") numVal = Infinity;
    else if (lower === "-inf" || lower === "-infinity") numVal = -Infinity;
    else {
      numVal = parseInt(val);
      if (isNaN(numVal)) numVal = null;
    }
    updateValue(numVal);
  };

  const handleFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      importJSON(content);
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef) fileInputRef.value = "";
  };

  return (
    <div id="sidebar" class="col-lg-3 col-md-4 bg-light shadow-sm p-4 border-end h-100 overflow-auto">
      <div class="d-flex flex-column h-100 sidebar-content">
        
        {/* Algorithm Controls */}
        <div class="mb-4">
          <h5 class="text-dark fw-bold mb-3">
            <i class="fas fa-play-circle me-2"></i>Algorithm Control
          </h5>
          
          {/* Algorithm Mode Toggle */}
          <div class="mb-3 p-3 bg-white rounded border">
            <div class="form-check form-switch">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="alphaBetaToggle" 
                checked={state.useAlphaBeta} 
                onChange={(e) => setUseAlphaBeta(e.currentTarget.checked)}
              />
              <label class="form-check-label fw-bold" for="alphaBetaToggle">
                <i class="fas fa-cut me-2"></i>Alpha-Beta Pruning
              </label>
            </div>
            <small class="text-muted d-block mt-1">
              Optimized algorithm with alpha-beta pruning
            </small>
          </div>

          {/* Node History Toggle */}
          <div class="mb-3 p-3 bg-white rounded border">
            <div class="form-check form-switch">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="showHistoryToggle" 
                checked={state.showHistory} 
                onChange={(e) => setShowHistory(e.currentTarget.checked)}
              />
              <label class="form-check-label fw-bold" for="showHistoryToggle">
                <i class="fas fa-history me-2"></i>Show Node History
              </label>
            </div>
            <small class="text-muted d-block mt-1">
              Display history of alpha-beta values in nodes
            </small>
          </div>
          
          <div class="d-grid gap-2">
            <button id="run" class="btn btn-dark btn-lg" onClick={runAll}>
              <i class="fas fa-play me-2"></i>Run All
            </button>
            <div class="row g-2">
              <div class="col-6">
                <button id="stepBack" class="btn btn-outline-secondary w-100" onClick={stepBack}>
                  <i class="fas fa-step-backward me-1"></i>Back
                </button>
              </div>
              <div class="col-6">
                <button id="step" class="btn btn-secondary w-100" onClick={stepForward}>
                  <i class="fas fa-step-forward me-1"></i>Forward
                </button>
              </div>
            </div>
            <button id="reset" class="btn btn-outline-dark" onClick={resetAlgorithm}>
              <i class="fas fa-redo me-2"></i>Reset
            </button>
          </div>
        </div>

        {/* Tree Generator */}
        <div class="mb-4">
          <h5 class="text-dark fw-bold mb-3">
            <i class="fas fa-magic me-2"></i>Generate Tree
          </h5>
          <div class="d-grid gap-2">
            <button id="generateTree" class="btn btn-dark w-100" onClick={generateRandomTree}>
              <i class="fas fa-dice me-2"></i>Generate Random Tree
            </button>
            <button id="loadImageGraph" class="btn btn-outline-dark w-100" onClick={loadImageGraph}>
              <i class="fas fa-image me-2"></i>Load Image Graph
            </button>
            <button id="resetView" class="btn btn-outline-secondary w-100" onClick={resetView}>
              <i class="fas fa-expand me-2"></i>Reset View
            </button>
          </div>
        </div>

        {/* Save & Load */}
        <div class="mb-4">
          <h5 class="text-dark fw-bold mb-3">
            <i class="fas fa-save me-2"></i>Save & Load
          </h5>
          <div class="d-grid gap-2">
            <button id="exportJSON" class="btn btn-outline-dark w-100" onClick={exportJSON}>
              <i class="fas fa-file-download me-2"></i>Export JSON
            </button>
            <button id="importJSONBtn" class="btn btn-outline-dark w-100" onClick={() => fileInputRef?.click()}>
              <i class="fas fa-file-upload me-2"></i>Import JSON
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              id="importJSONInput" 
              class="d-none" 
              accept=".json" 
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Node Information */}
        <div class="mb-4">
          <h5 class="text-dark fw-bold mb-3">
            <i class="fas fa-circle-nodes me-2"></i>Node Information
          </h5>
          
          <Show when={!state.selectedNode && !state.isRunning}>
            <div id="unselectedInfo" class="alert alert-light border d-flex align-items-center">
              <i class="fas fa-mouse-pointer me-2 text-secondary"></i>
              <div>
                <strong class="text-dark">Select a node</strong><br />
                <small class="text-muted">Edit: click node | Zoom: wheel | Pan: drag bg | Step: Arrows | Reset: R</small>
              </div>
            </div>
          </Show>

          <Show when={state.isRunning}>
            <div id="runningInfo" class="alert alert-secondary">
              <i class="fas fa-exclamation-triangle me-2"></i>
              <strong>Algorithm Running</strong><br />
              <small>Reset to edit nodes</small>
            </div>
          </Show>

          <Show when={state.selectedNode && !state.isRunning}>
            <div id="nodeInfo">
              <div class="card border-dark">
                <div class="card-body">
                  <h6 class="card-title text-dark mb-2">
                    <i class="fas fa-dot-circle me-1"></i>Selected Node
                  </h6>
                  <p id="nodeTypeText" class="card-text mb-2">
                    {state.selectedNode?.max ? "Maximizer Node" : "Minimizer Node"}
                  </p>
                  
                  {/* Centralized Node Value Input */}
                  <Show when={state.selectedNode?.children.length === 0}>
                    <div id="nodeValueContainer" class="mb-3">
                      <label for="nodeValueInput" class="form-label small fw-bold mb-1">Node Value:</label>
                      <div class="input-group input-group-sm">
                        <input 
                          type="text" 
                          id="nodeValueInput" 
                          class="form-control" 
                          placeholder="Value or 'inf'"
                          value={state.selectedNode?.value === Infinity ? "inf" : (state.selectedNode?.value === -Infinity ? "-inf" : (state.selectedNode?.value ?? ""))}
                          onInput={(e) => handleValueChange(e.currentTarget.value)}
                        />
                        <button class="btn btn-outline-dark" type="button" onClick={() => handleValueChange("inf")} title="Positive Infinity">&infin;</button>
                        <button class="btn btn-outline-dark" type="button" onClick={() => handleValueChange("-inf")} title="Negative Infinity">-&infin;</button>
                      </div>
                    </div>
                  </Show>
                  
                  <div class="d-grid gap-2">
                    <button id="addChild" class="btn btn-outline-dark btn-sm" onClick={addChild}>
                      <i class="fas fa-plus me-1"></i>Add Child
                    </button>
                    <Show when={state.selectedNode?.layer !== 0}>
                      <button id="deleteNode" class="btn btn-outline-secondary btn-sm" onClick={deleteNode}>
                        <i class="fas fa-trash me-1"></i>Delete Node
                      </button>
                    </Show>
                  </div>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
