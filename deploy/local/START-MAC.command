#!/bin/sh
cd "$(dirname "$0")" || exit 1
case "$(uname -m)" in arm64) arch=arm64;; *) arch=x64;; esac
chmod +x "runtime/darwin-$arch/node"
exec "runtime/darwin-$arch/node" start.cjs
