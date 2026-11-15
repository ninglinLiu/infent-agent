#!/bin/sh
cd "$(dirname "$0")" || exit 1
case "$(uname -m)" in aarch64|arm64) arch=arm64;; x86_64) arch=x64;; *) echo 'Unsupported architecture'; exit 1;; esac
chmod +x "runtime/linux-$arch/node"
exec "runtime/linux-$arch/node" start.cjs
