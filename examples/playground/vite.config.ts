import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  resolve: {
    alias: {
      "@traqto/dashboard-kit": resolve(__dirname, "../../src/index.ts"),
    },
  },
  server: {
    port: 5180,
    open: true,
  },
});