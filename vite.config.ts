import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  root: "web",
  build: {
    outDir: "../dist_web",
    emptyOutDir: true,
  },
});
