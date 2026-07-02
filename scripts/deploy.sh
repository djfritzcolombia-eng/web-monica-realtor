#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.local/node-v22.16.0/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Building production bundle..."
npm run build

echo "→ Checking Firebase authentication..."
if ! firebase projects:list >/dev/null 2>&1; then
  echo ""
  echo "No hay sesión de Firebase. Se abrirá el login en el navegador."
  firebase login
fi

echo "→ Build output:"
ls -la dist/assets/index-*.js dist/index.html

echo ""
echo "→ Deploying to Firebase Hosting (project: monicafritzrealtor)..."
firebase deploy --only hosting --project monicafritzrealtor

echo ""
echo "Deploy listo. Verifica que el HTML apunte a un JS distinto a index-DGPRMMkI.js"
echo "  https://monicafritzrealtor.web.app"
echo "  https://monicafritzrealtor.firebaseapp.com"
