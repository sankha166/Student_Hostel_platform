import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "localhost",
    port: 8081,
    strictPort: true,
    hmr: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "localhost",
    port: 8081,
    strictPort: true,
  },
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["framer-motion", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tabs", "@radix-ui/react-select"],
          "query-vendor": ["@tanstack/react-query"],
          "maps-vendor": ["@react-google-maps/api"],
        },
      },
    },
  },
}));
