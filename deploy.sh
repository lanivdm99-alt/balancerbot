#!/bin/bash

# FLASH-X Cloudflare Pages Deployment Script

echo "🚀 Starting FLASH-X deployment to Cloudflare Pages..."

# Step 1: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf node_modules/.cache

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 3: Build the project
echo "🔨 Building project..."
npm run build

# Step 4: Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Error: dist folder not found after build!"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: dist/index.html not found!"
    exit 1
fi

echo "✅ Build successful!"
echo "📊 Build output:"
ls -lh dist/

# Step 5: Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler not found. Installing..."
    npm install -g wrangler
fi

# Deploy using wrangler pages
wrangler pages deploy dist --project-name=flash-x

echo "✅ Deployment complete!"
echo "🎉 Your site should be live at: https://flash-x.pages.dev"
