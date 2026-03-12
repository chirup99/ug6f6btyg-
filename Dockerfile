# Optimized Dockerfile for Cloud Run - Minimal dependencies
FROM node:22-slim

WORKDIR /usr/src/app

# Add ARG declarations for build-time environment variables
ARG VITE_API_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# Copy package files explicitly
COPY package.json ./
COPY package-lock.json ./

# Install ALL dependencies (including devDependencies) for build
RUN npm install

# Copy ALL source code (server, shared, client)
COPY . .

# Build frontend and backend using the build script
# Pass the build-time arguments to the build command
RUN VITE_API_URL=$VITE_API_URL \
    VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    npm run build

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
