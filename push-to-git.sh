#!/bin/bash
set -e
echo "🚀 ErgoHub Git Sync"
if [ ! -d ".git" ]; then echo "❌ Run inside hr/ repo folder"; exit 1; fi
git add .
git commit -m "feat: ErgoHub foundation — Phases 0-7 complete" 2>/dev/null || echo "Nothing to commit"
git push origin main
echo "✅ Done! https://github.com/jimxyd/hr"
