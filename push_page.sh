#!/usr/bin/env bash
# Publish the project page as the user site of the LIBERO-PeRM-NeurIPS account:
#   https://libero-perm-neurips.github.io/
# Prereq (on GitHub, logged in as LIBERO-PeRM-NeurIPS): create an EMPTY public repo named
#   LIBERO-PeRM-NeurIPS.github.io      (a user site is served from the default branch root)
# and make sure the machine you push from can authenticate as that account or as a collaborator.
#   bash /data3/zhixu/LIBERO-PeRM-page/push_page.sh [remote-url]
set -e
cd /data3/zhixu/LIBERO-PeRM-page
REMOTE="${1:-git@github.com:LIBERO-PeRM-NeurIPS/LIBERO-PeRM-NeurIPS.github.io.git}"
git remote remove pages 2>/dev/null || true
git remote add pages "$REMOTE"
git push -u pages main
echo ""
echo "Pushed to $REMOTE"
echo "Site: https://libero-perm-neurips.github.io/  (first build takes a few minutes; check repo Settings -> Pages)"
