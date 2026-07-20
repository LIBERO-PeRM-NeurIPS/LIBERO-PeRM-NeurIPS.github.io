#!/usr/bin/env bash
# Push the LIBERO-PeRM project page to GitHub.
# Prereq: create an EMPTY repo on GitHub first (no README), then run:
#   bash /data3/zhixu/LIBERO-PeRM-page/push_page.sh [git@github.com:<owner>/<repo>.git]
# Default remote: git@github.com:ZhixuLi-the-Runner/LIBERO-PeRM-page.git
set -e
cd /data3/zhixu/LIBERO-PeRM-page
REMOTE="${1:-git@github.com:ZhixuLi-the-Runner/LIBERO-PeRM-page.git}"
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
git push -u origin main
echo ""
echo "✅ Pushed to $REMOTE"
echo "👉 最后一步：GitHub repo → Settings → Pages → Source 选 'Deploy from a branch' → Branch 选 main / (root) → Save"
echo "   几分钟后站点会出现在 https://<owner>.github.io/<repo>/"
