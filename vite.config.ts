import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.CI ? "/expo-landivar/" : "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        arjs: resolve(__dirname, "arjs.html"),
        "arjs-placement": resolve(__dirname, "arjs-placement.html"),
        mindar: resolve(__dirname, "mindar.html"),
        "webxr-placement": resolve(__dirname, "webxr-placement.html"),
        mediapipe: resolve(__dirname, "mediapipe.html"),
        "control-center": resolve(__dirname, "control-center.html"),
      },
    },
  },
});
