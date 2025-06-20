# Deploy B3X Mail to GitHub

## Quick Commands

### 1. Make upload script executable
```bash
chmod +x upload-to-github.sh
```

### 2. Run the upload script
```bash
./upload-to-github.sh
```

### 3. Create GitHub repository
1. Go to [GitHub](https://github.com/new)
2. Repository name: `b3x-mail`
3. Description: `Modern temporary email service with Telegram integration`
4. Set to **Public**
5. Don't initialize with README (we already have one)
6. Click "Create repository"

### 4. Connect to your GitHub repository
```bash
# Replace 'yourusername' with your actual GitHub username
git remote add origin https://github.com/yourusername/b3x-mail.git
git branch -M main
git push -u origin main
```

## Manual Upload (Alternative)

If you prefer manual control:

### 1. Initialize Git
```bash
git init
git add .
git commit -m "Initial commit: B3X Mail - Temporary Email Service"
```

### 2. Connect to GitHub
```bash
git remote add origin https://github.com/yourusername/b3x-mail.git
git branch -M main
git push -u origin main
```

## What Gets Uploaded

### ✅ Essential Files
- `README.md` - Project documentation with logo
- `package.json` & `package-lock.json` - Dependencies
- `client/` - React frontend source code
- `server/` - Node.js backend source code  
- `shared/` - Shared TypeScript schemas
- `cloudflare-worker.js` - Email routing worker
- `*.md` files - All documentation
- `LICENSE` - MIT license
- `.env.example` - Environment template
- `attached_assets/` - Project logo
- Configuration files (tsconfig.json, tailwind.config.ts, etc.)

### ❌ Excluded Files (via .gitignore)
- `.env` - Your actual environment variables
- `node_modules/` - Dependencies (will be installed via npm)
- `.replit` & `replit.nix` - Replit-specific files
- Build outputs (`dist/`, `build/`)
- Database files (`*.db`, `*.sqlite`)
- Logs and temporary files
- IDE-specific files (`.vscode/`, `.idea/`)

## Repository Settings

### Recommended Settings
- **Visibility**: Public (for open source)
- **License**: MIT (already included)
- **Topics**: Add these tags
  - `email-service`
  - `telegram-bot`
  - `temporary-email`
  - `cloudflare-workers`
  - `react`
  - `nodejs`
  - `typescript`
  - `postgresql`

### Branch Protection (Optional)
- Enable branch protection on `main`
- Require pull request reviews
- Require status checks to pass

## After Upload

### 1. Update Repository Links
Edit these files to replace placeholder URLs:
- `README.md` - Update GitHub links to your actual repo
- `package.json` - Add repository field

### 2. Enable GitHub Features
- **Issues**: For bug reports and feature requests
- **Discussions**: For community questions
- **Actions**: For CI/CD (optional)
- **Pages**: For documentation hosting (optional)

### 3. Create Releases
Tag versions for stable releases:
```bash
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```

## Security Notes

- `.env` file is excluded - contains sensitive data
- All hardcoded credentials have been replaced with placeholders
- Bot tokens and API keys are in environment variables only
- Database URLs are templated in `.env.example`

Your B3X Mail project is now ready for the open source community!