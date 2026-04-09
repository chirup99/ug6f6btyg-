/**
 * Server-side performance optimizations for Perala
 *
 * 1. API response compression (gzip/brotli for JSON)
 * 2. Resource preload Link headers (tells browser what JS/CSS to fetch early)
 * 3. In-memory TTL cache for expensive API responses
 * 4. Security + perf response headers
 */

import compression from 'compression';
import type { Request, Response, NextFunction, Express } from 'express';
import fs from 'fs';
import path from 'path';

// ── 1. API Compression Middleware ─────────────────────────────────────────────
// Compress all text responses > 1 KB (JSON, HTML, plain text)
export const compressionMiddleware = compression({
  filter(req, res) {
    // Don't compress SSE (Server-Sent Events) connections — gzip buffering breaks streaming
    // Check for exact SSE endpoint paths (not /status sub-paths which return JSON)
    if (req.path === '/api/angelone/live-stream-ws') return false;
    if (req.path === '/api/angelone/live-stream') return false;
    // Don't compress responses that already have Content-Encoding (pre-compressed static)
    if (res.getHeader('Content-Encoding')) return false;
    // Don't compress WebSocket upgrades
    if (req.headers.upgrade === 'websocket') return false;
    return compression.filter(req, res);
  },
  level: 6, // Balanced between speed and size (1=fastest, 9=smallest)
  threshold: 1024, // Only compress responses > 1 KB
  chunkSize: 16 * 1024, // 16 KB chunks
  memLevel: 8,
});

// ── 2. Resource Preload Link Headers ─────────────────────────────────────────
// Read Vite manifest and emit Link: <url>; rel=preload headers for critical assets.
// This tells the browser to start fetching JS/CSS before it even parses index.html,
// eliminating a full round-trip for critical resources.

let cachedPreloadHeaders: string | null = null;
let preloadHeadersBuilt = false;

function buildPreloadHeaders(distPath: string, cdnBase = ''): string {
  if (preloadHeadersBuilt && cachedPreloadHeaders !== null) return cachedPreloadHeaders;

  try {
    const manifestPath = path.join(distPath, '.vite', 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      preloadHeadersBuilt = true;
      cachedPreloadHeaders = '';
      return '';
    }

    const manifest: Record<string, { file: string; css?: string[]; imports?: string[] }> =
      JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const links: string[] = [];
    const seen = new Set<string>();

    const addLink = (file: string, type: 'script' | 'style') => {
      if (seen.has(file)) return;
      seen.add(file);
      const url = cdnBase ? `${cdnBase}${file}` : `/${file}`;
      const as = type === 'script' ? 'script' : 'style';
      links.push(`<${url}>; rel=preload; as=${as}; crossorigin`);
    };

    // Find entry point (main.tsx / index.tsx)
    for (const [src, chunk] of Object.entries(manifest)) {
      if (src.includes('main.tsx') || src.includes('main.ts') || src.endsWith('index.html')) {
        // Preload the entry JS
        addLink(chunk.file, 'script');
        // Preload its CSS
        for (const css of chunk.css ?? []) addLink(css, 'style');
        // Preload direct JS imports (vendor chunks)
        for (const imp of chunk.imports ?? []) {
          const dep = manifest[imp];
          if (dep) addLink(dep.file, 'script');
        }
      }
    }

    // Also preload vendor-react and vendor-query (always needed)
    for (const [src, chunk] of Object.entries(manifest)) {
      if (
        src.includes('vendor-react') ||
        src.includes('vendor-query') ||
        src.includes('vendor-radix')
      ) {
        addLink(chunk.file, 'script');
      }
    }

    cachedPreloadHeaders = links.join(', ');
    preloadHeadersBuilt = true;
    return cachedPreloadHeaders;
  } catch {
    preloadHeadersBuilt = true;
    cachedPreloadHeaders = '';
    return '';
  }
}

// Middleware that attaches preload Link headers when serving index.html
export function preloadHintsMiddleware(distPath: string, cdnBase = '') {
  return (_req: Request, res: Response, next: NextFunction) => {
    const original = res.sendFile.bind(res);
    // Only patch HTML responses
    const originalJson = res.json.bind(res);
    res.sendFile = function (filePath: string, ...args: any[]) {
      if (typeof filePath === 'string' && filePath.endsWith('index.html')) {
        const links = buildPreloadHeaders(distPath, cdnBase);
        if (links) res.setHeader('Link', links);
      }
      return original(filePath, ...args);
    };
    next();
  };
}

// ── 3. In-Memory TTL API Response Cache ──────────────────────────────────────
// Cache responses for expensive read-only endpoints (market data, instruments, etc.)
// This avoids hitting upstream APIs on every request for data that rarely changes.

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) cache.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Express middleware factory: caches GET responses for `ttlSeconds`.
 * Usage: app.get('/api/market/indices', apiCache(60), handler)
 */
export function apiCache(ttlSeconds: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const key = req.originalUrl;
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
      return res.json(hit.data);
    }

    // Intercept res.json to store the response in cache
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, { data: body, expiresAt: Date.now() + ttlSeconds * 1000 });
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Manually clear a cached key or all keys matching a prefix.
 */
export function clearApiCache(prefix?: string) {
  if (!prefix) { cache.clear(); return; }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

// ── 4. Performance Response Headers ──────────────────────────────────────────
// Add headers that improve perceived performance and browser rendering speed.
export function perfHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Hint browser to keep TCP connection alive (reduces handshake overhead)
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=30, max=1000');

  // DNS prefetch for external APIs used by the frontend
  res.setHeader(
    'X-DNS-Prefetch-Control',
    'on'
  );

  // Allow browser to start loading subresources immediately
  // (disable overly strict referrer that could delay resource loading)
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}

// ── 5. Apply all performance middleware to an Express app ────────────────────
export function applyPerformanceMiddleware(app: Express) {
  // Compression for all API/dynamic responses (must be before routes)
  app.use(compressionMiddleware);

  // Performance headers on every response
  app.use(perfHeadersMiddleware);
}
