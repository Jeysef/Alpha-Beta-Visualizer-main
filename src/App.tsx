import { onMount, type Component } from "solid-js";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Visualizer } from "./components/Visualizer";
import { generateRandomTree } from "./store/treeStore";

const App: Component = () => {
  onMount(() => {
    generateRandomTree();
  });

  return (
    <div class="vh-100 d-flex flex-column overflow-hidden">
      <Header />
      <div class="container-fluid flex-grow-1 overflow-hidden" id="layoutContainer">
        <div class="row h-100 g-0">
          <Sidebar />
          <Visualizer />
        </div>
      </div>
    </div>
  );
};

export default App;
