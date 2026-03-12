# Optimized Dockerfile for Cloud Run - Minimal dependencies
FROM node:22-slim

WORKDIR /usr/src/app

# Copy package files explicitly
COPY package.json ./
COPY package-lock.json ./

# Install ALL dependencies (including devDependencies) for build
RUN npm install

# Copy ALL source code (server, shared, client)
COPY . .

# Build frontend and backend using the build script
RUN npm run build

# Keep dependencies (Cloud Run needs them at runtime)
# DON'T prune - external packages are needed

# Expose port (Cloud Run will set PORT env var, but 8080 is default)
EXPOSE 8080

# Environment
ENV NODE_ENV=production

# Healthcheck for Cloud Run using ES modules syntax
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node --input-type=module -e "import('http').then(http => http.default.get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}))"

# Start server - PORT env var will be set by Cloud Run
CMD ["node", "dist/index.js"]
