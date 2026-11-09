#!/bin/sh
# Snapshot one film: sh snap.sh <film> <times> <outdir>. Temporarily switches the default film.
set -e
cd "$(dirname "$0")"
cp index.html .index.backup.html
sed -i '' "s/\"default\":\"[a-z]*-[0-9]\"/\"default\":\"$1\"/" index.html
hyperframes snapshot --at "$2" -o "$3" >/dev/null 2>&1 || true
mv .index.backup.html index.html
