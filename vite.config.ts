import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },

  vite: {
    preview: {
      allowedHosts: ["demo.levelupfitness.co.ke"],
      host: "127.0.0.1",
      port: 3001,
    },
  },
});
