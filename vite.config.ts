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
        "aframe-placement": resolve(__dirname, "aframe-placement.html"),
        mindar: resolve(__dirname, "mindar.html"),
        "ar-index": resolve(__dirname, "ar/index.html"),
        "ar-pokemon-cards": resolve(__dirname, "ar/pokemon-cards.html"),
        "ar-interactive-book": resolve(__dirname, "ar/interactive-book.html"),
        "ar-business-card": resolve(__dirname, "ar/business-card.html"),
        "webxr-placement": resolve(__dirname, "webxr-placement.html"),
        mediapipe: resolve(__dirname, "mediapipe.html"),
        "control-center": resolve(__dirname, "control-center.html"),
      },
    },
  },
});
