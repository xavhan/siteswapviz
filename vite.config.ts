import { resolve } from "node:path";
import { defineConfig } from "vite";

// Without this, `vite build` emits index.html only and silently drops docs.html.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        docs: resolve(__dirname, "docs.html"),
      },
    },
  },
});
