#!/bin/bash

# B3X Mail - GitHub Upload Script
# This script uploads only the necessary files to your GitHub repository

echo "🚀 B3X Mail - GitHub Upload Script"
echo "=================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
fi

# Set up .gitignore to exclude sensitive files
echo "🔒 Ensuring .gitignore is properly configured..."
if [ ! -f ".gitignore" ]; then
    echo "❌ .gitignore not found! Please ensure .gitignore exists."
    exit 1
fi

# Add all project files (excluding those in .gitignore)
echo "📁 Adding project files..."
git add .

# Show what will be committed
echo "📋 Files to be uploaded:"
git status --porcelain

# Create initial commit or add changes
if git rev-parse --verify HEAD >/dev/null 2>&1; then
    echo "💾 Creating commit with changes..."
    git commit -m "Update B3X Mail project - $(date '+%Y-%m-%d %H:%M:%S')"
else
    echo "💾 Creating initial commit..."
    git commit -m "Initial commit: B3X Mail - Temporary Email Service

Features:
- Temporary & permanent email addresses
- Telegram bot integration
- Cloudflare Workers email routing
- Anti-spam protection
- PostgreSQL database
- React + TypeScript frontend
- Node.js + Express backend"
fi

echo ""
echo "🎯 Essential files included:"
echo "   ✅ README.md (with logo)"
echo "   ✅ package.json & package-lock.json"
echo "   ✅ Source code (client/, server/, shared/)"
echo "   ✅ Configuration files"
echo "   ✅ Documentation (*.md files)"
echo "   ✅ Cloudflare Worker script"
echo "   ✅ License & environment template"
echo "   ✅ Project logo"
echo ""
echo "🚫 Excluded files:"
echo "   ❌ .env (sensitive data)"
echo "   ❌ node_modules/"
echo "   ❌ .replit files"
echo "   ❌ Build artifacts"
echo "   ❌ Database files"
echo "   ❌ Logs and temporary files"

echo ""
echo "🔗 Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Run: git remote add origin https://github.com/yourusername/b3x-mail.git"
echo "3. Run: git branch -M main"
echo "4. Run: git push -u origin main"
echo ""
echo "✨ Your B3X Mail project is ready for GitHub!"