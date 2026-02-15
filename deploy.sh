#!/bin/sh

set -e

if [ ! -d pages/ ]; then
  echo "cloning repo"
  git clone ssh://git@codeberg.org/dragsbruh/pages.git pages/
fi

cd pages

echo "fetching origin"
git fetch origin

echo "switching branch"
if git show-ref --verify --quiet refs/heads/pages; then
  git checkout pages
else
  git checkout -b pages
fi

echo "updating pages from origin"
git pull --ff-only origin pages || true

cd ..

echo "building with zola"
if [ -n "$BASE_URL" ]; then
  zola build --base-url "$BASE_URL"
else
  zola build
fi

echo "copying build files"
find pages/ -mindepth 1 -not -path "pages/.git*" -delete
cp -r public/. pages/

cd pages/

echo "committing and pushing build"
git add .
git commit -m "build $(date -Iseconds --utc)"
git push -u origin pages

cd ..
echo "complete"

