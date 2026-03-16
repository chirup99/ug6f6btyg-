import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer()
          ),
        ]
      : []),
  ],
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "wouter",
      "@tanstack/react-query",
      "framer-motion",
      "lucide-react",
      "recharts",
      "date-fns",
      "zod",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    hmr: {
      clientPort: 443,
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    allowedHosts: true,
    warmup: {
      clientFiles: [
        "./client/src/main.tsx",
        "./client/src/App.tsx",
        "./client/src/pages/home.tsx",
        "./client/src/pages/dashboard.tsx",
        "./client/src/lib/queryClient.ts",
        "./client/src/lib/utils.ts",
      ],
    },
  },
});
