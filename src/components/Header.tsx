import { type Component } from "solid-js";

export const Header: Component = () => {
  return (
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div class="container-fluid">
        <button id="sidebarToggle" class="btn btn-outline-light me-3">
          <i class="fas fa-bars"></i>
        </button>
        <a class="navbar-brand fw-bold" href="#">
          <i class="fas fa-tree me-2"></i>
          Alpha-Beta Visualizer
        </a>
        <div class="navbar-text d-none d-md-block">
          <small class="text-light opacity-75">Interactive Alpha-Beta Pruning Algorithm</small>
        </div>
      </div>
    </nav>
  );
};
