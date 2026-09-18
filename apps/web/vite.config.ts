import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        main: new URL("./index.html", import.meta.url).pathname,
        sprites: new URL("./sprites.html", import.meta.url).pathname,
      },
    },
  },
});
