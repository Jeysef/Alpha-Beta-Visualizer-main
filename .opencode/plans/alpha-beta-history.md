# Alpha-Beta History Tracking with UI Toggle

**Objective:**
Add a history of `alpha` and `beta` values to each node in the Alpha-Beta Visualizer, with a UI toggle to enable/disable its display.
- Nodes should keep a history of their `alpha`/`beta` values.
- Children should start with a fresh history based on the parent's *current* (latest) value at the time of the call.
- The history should be displayed visually in the node labels, controlled by a toggle.

**Proposed Changes:**

### 1. treeStore.ts (`src/store/treeStore.ts`)
- **State:** Add `showHistory: boolean` (default: `false`) to `TreeState`.
- **Action:** Add `setShowHistory` to update this state.
- **Algorithm Logic:** 
  - `resetAlgorithm`: Clear `alphaHistory` and `betaHistory` for all nodes.
  - `stepForward` / `runAll`: Correctly initialize history arrays for the root node.

### 2. Node.ts (`src/logic/Node.ts`)
- **Properties:** Add `alphaHistory: number[] = []` and `betaHistory: number[] = []`.
- **Minimax logic:**
  - **Step 0 (initialization):** Push current `alpha` and `beta` (if not null) to history.
  - **Step 2 (update):** Push new values into history whenever `alpha` or `beta` is updated.
- **Serialization/Deserialization:**
  - Update `serialize` and `deserialize` to include history arrays (mapping `Infinity` values).
- **Drawing:**
  - Modify `draw` signature to accept `showHistory: boolean`.
  - Display full history (e.g., `α: [-∞, 5, 8]`) if `showHistory` is true.
  - Display only current value (e.g., `α: 8`) if `showHistory` is false.

### 3. Sidebar.tsx (`src/components/Sidebar.tsx`)
- Add a "Show Node History" switch in the Algorithm Control section.

### 4. Visualizer.tsx (`src/components/Visualizer.tsx`)
- Pass `state.showHistory` to the `root.draw()` call.

**Verification:**
- Toggle "Show Node History" and verify labels update dynamically.
- Step forward/backward and verify history builds and restores correctly.
- Ensure children start with fresh history arrays.
