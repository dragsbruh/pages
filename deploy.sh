#!/bin/sh

set -e

REPO="ssh://git@codeberg.org/dragsbruh/pages.git"
BRANCH="pages"

REPODIR="./pages/"
ROOTDIR="$PWD"

if [ ! -d pages/ ]; then
  echo "cloning repository"

  GITLOG="$(mktemp)"
  git clone "$REPO" "$REPODIR" --depth 1 2> "$GITLOG" || {
    echo "repository clone failed"
    cat "$GITLOG"
    exit 1
  }
else
  echo "updating repository"

  cd "$REPODIR"
  git pull
  cd "$ROOTDIR"
fi

echo "removing old files"
find "$REPODIR" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf -- {} +

echo "building zine site"
zine release -f -o "$REPODIR"

cd "$REPODIR"

git add .
git commit -m "build $(date -Iseconds --utc)" || true

echo "pushing update"
git push -u origin "$BRANCH"

cd "$ROOTDIR"

echo "complete"
