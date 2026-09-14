#!/bin/sh

# adapted from .woodpecker/build.yml which is still the main build script

set -e

MINIFY_URL="http://copy.infra.ririna.net/infra/ci/minify_linux_amd64.tar.gz"
ZINE_URL="http://copy.infra.ririna.net/infra/ci/zine-x86_64-linux-musl.tar.xz"

run() {
  echo "$@"
  "$@"
}

download() {
  dst="$1"
  url="$2"

  if [ ! -f "$dst" ]; then
    tmp="$(mktemp)"
    wget -qO "$tmp" "$url"
    mv "$tmp" "$dst"
  fi
}

mkdir -p .ci/cache .ci/bin

run download .ci/cache/zine.tar.xz "$ZINE_URL"
run download .ci/cache/minify.tar.gz "$MINIFY_URL"

run tar xf .ci/cache/zine.tar.xz -C .ci/bin/
run tar xf .ci/cache/minify.tar.gz -C .ci/bin/ minify

rm -rf .ci/build

run ./.ci/bin/zine release -o .ci/build
run ./.ci/bin/minify -ari .ci/build

(
  if [ ! -d .ci/publish  ]; then
    run git clone --branch pages --depth 1 "ssh://repo.infra.ririna.net/dragsbruh/pages.git" .ci/publish
    cd .ci/publish
    git remote add codeberg ssh://git@codeberg.org/dragsbruh/pages.git
  else
    cd .ci/publish
  fi

  git config user.email "noreply+woodpecker@ririna.net"
  git config user.name "john woodpecker"

  git rm -r . || true
  cp -a ../build/. .

  git add --all
  run git commit -m "ci (trigger by ${CI_COMMIT_SHA})" --allow-empty

  run git push codeberg pages
  run git-pages-cli https://furina.is-a.dev --upload-git https://codeberg.org/dragsbruh/pages.git
  run git-pages-cli https://www.furina.is-a.dev --upload-git https://codeberg.org/dragsbruh/pages.git

  run git push origin pages
)
