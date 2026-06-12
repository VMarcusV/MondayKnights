import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Relatieve paden zodat de app op elke GitHub Pages-URL werkt
  base: "./",
  plugins: [react(), tailwindcss()],
});
