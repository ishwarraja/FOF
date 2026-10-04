#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then echo "Node.js 20+ is required."; exit 1; fi
if [ ! -d node_modules ] || [ ! -x node_modules/.bin/vite ]; then
  echo "Installing dependencies from package-lock.json..."
  npm ci --no-audit --no-fund
fi
npm run validate:source
npm run validate:assets
npm run validate:animation
npm run test:combat-graphics
exec npm run dev
