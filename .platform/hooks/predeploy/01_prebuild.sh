#!/bin/bash
set -e

# Log execution
echo "================================"
echo "🚀 AWS EB Pre-deployment Hook"
echo "================================"

# Ensure dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ ERROR: dist folder not found!"
    echo "Available files:"
    ls -la
    exit 1
fi

# Check if index.js exists
if [ ! -f "dist/index.js" ]; then
    echo "❌ ERROR: dist/index.js not found!"
    echo "dist/ contents:"
    ls -la dist/
    exit 1
fi

echo "✅ dist/index.js exists"
echo "✅ dist folder size: $(du -sh dist | cut -f1)"

# Verify package.json
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found!"
    exit 1
fi

echo "✅ package.json exists"

# Set environment variables if not already set
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
fi

echo "✅ NODE_ENV: $NODE_ENV"
echo "✅ Pre-deployment checks passed"
echo "================================"