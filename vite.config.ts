import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { compression } from "vite-plugin-compression2";

const cdnUrl = process.env.VITE_CDN_URL;

export default defineConfig({
  base: cdnUrl || "/",
  plugins: [
    react(),
    runtimeErrorOverlay(),
    compression({ algorithm: "brotliCompress", exclude: [/\.(png|jpg|webp|gif|ico|woff2)$/] }),
    compression({ algorithm: "gzip", exclude: [/\.(png|jpg|webp|gif|ico|woff2)$/] }),
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
      "lucide-react",
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
    assetsDir: "assets",
    manifest: true,
    chunkSizeWarningLimit: 4000,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    hmr: process.env.REPLIT_DEV_DOMAIN
      ? {
          host: process.env.REPLIT_DEV_DOMAIN,
          clientPort: 443,
          protocol: "wss",
        }
      : true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    allowedHosts: true,
    warmup: {
      clientFiles: [
        "./client/src/main.tsx",
        "./client/src/App.tsx",
        "./client/src/lib/queryClient.ts",
        "./client/src/lib/utils.ts",
      ],
    },
  },
});
