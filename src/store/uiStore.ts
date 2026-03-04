import { createSignal } from "solid-js";

const [sidebarVisible, setSidebarVisible] = createSignal(true);

export const useUIState = () => ({
  sidebarVisible,
  toggleSidebar: () => setSidebarVisible(!sidebarVisible()),
});
