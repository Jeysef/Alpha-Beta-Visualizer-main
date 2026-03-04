import { onMount, onCleanup, Show, type Component } from "solid-js";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Visualizer } from "./components/Visualizer";
import { generateRandomTree, stepForward, stepBack, resetAlgorithm } from "./store/treeStore";
import { useUIState } from "./store/uiStore";

const App: Component = () => {
  const { sidebarVisible } = useUIState();

  onMount(() => {
    generateRandomTree();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "ArrowRight") {
        e.preventDefault();
        stepForward();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        stepBack();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        resetAlgorithm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  return (
    <div class="vh-100 d-flex flex-column overflow-hidden">
      <Header />
      <div class="container-fluid flex-grow-1 overflow-hidden" id="layoutContainer">
        <div class="row h-100 g-0">
          <Show when={sidebarVisible()}>
            <Sidebar />
          </Show>
          <Visualizer />
        </div>
      </div>
    </div>
  );
};

export default App;
