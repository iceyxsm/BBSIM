#!/usr/bin/env bash
# QALGO — Start Full Development Environment
# Usage: ./scripts/linux/dev-all.sh

set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PIDS=()

cleanup() {
  echo ""
  echo -e "\033[31mShutting down all processes...\033[0m"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null
}
trap cleanup EXIT INT TERM

echo -e "\033[36m========================================\033[0m"
echo -e "\033[36m  QALGO — Full Development Environment\033[0m"
echo -e "\033[36m========================================\033[0m"

# Start API
echo -e "\033[33m[1/2] Starting API server...\033[0m"
cd "$ROOT" && pnpm --filter @qalgo/api dev &
PIDS+=($!)
sleep 3

# Start App Tauri (foreground)
echo -e "\033[33m[2/2] Launching App...\033[0m"
cd "$ROOT/apps/firm"
pnpm tauri:dev
