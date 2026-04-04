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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "vendor-react";
          }
          if (id.includes("node_modules/lightweight-charts")) {
            return "vendor-lightweight-charts";
          }
          if (
            id.includes("node_modules/recharts") ||
            id.includes("node_modules/d3-") ||
            id.includes("node_modules/d3/") ||
            id.includes("node_modules/victory-vendor")
          ) {
            return "vendor-recharts";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-framer-motion";
          }
          if (
            id.includes("node_modules/aws-amplify") ||
            id.includes("node_modules/@aws-amplify") ||
            id.includes("node_modules/amazon-cognito-identity-js") ||
            id.includes("node_modules/aws-jwt-verify")
          ) {
            return "vendor-auth";
          }
          if (
            id.includes("node_modules/@tanstack/react-query") ||
            id.includes("node_modules/@tanstack/query-core")
          ) {
            return "vendor-query";
          }
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }
        },
      },
    },
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
