#!/bin/sh

set -e

BRANCH="pages"
DESTDIR="./pages/"
ROOTDIR="$PWD"

echo "removing old files"
find "$DESTDIR" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf -- {} +

echo "building zine site"
zine release -f -o "$DESTDIR"

echo "pushing changes"

cd "$DESTDIR"
git add .
git commit -m "build $(date -Iminutes --utc)" || true
git push -u origin "$BRANCH"
cd "$ROOTDIR"
