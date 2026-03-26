#!/bin/bash
set -e

echo "================================"
echo "🚀 AWS EB Pre-deployment Hook"
echo "================================"

# Install production dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "📦 Installing production dependencies..."
    npm install --omit=dev --no-audit --no-fund
    echo "✅ Dependencies installed"
else
    echo "✅ node_modules already present"
fi

# Ensure dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ ERROR: dist folder not found!"
    ls -la
    exit 1
fi

if [ ! -f "dist/index.js" ]; then
    echo "❌ ERROR: dist/index.js not found!"
    ls -la dist/
    exit 1
fi

echo "✅ dist/index.js exists ($(du -sh dist | cut -f1))"
echo "✅ NODE_ENV: ${NODE_ENV:-production}"
echo "✅ Pre-deployment checks passed"
echo "================================"
