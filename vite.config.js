import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js ships in the lazily loaded 3D preview chunk (~250 kB gzip); it never blocks first paint.
    chunkSizeWarningLimit: 1000,
  },
});
