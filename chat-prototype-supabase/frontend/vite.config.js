import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ["sprint-staining-debtless.ngrok-free.dev"],
    // Proxy: las llamadas a /api las reenvía al backend local.
    // Así el celular solo necesita conectarse al frontend (ngrok),
    // y Vite se encarga de hablar con el backend internamente.
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
