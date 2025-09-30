import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        audio: "src/react-app/audio-upload.html",
        podcast: "src/react-app/podcast.html"
      }
    }
  }
});
