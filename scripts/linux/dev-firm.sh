#!/usr/bin/env bash
# BBSIM — Start Firm (Broker) Desktop App with Tauri
# Usage: ./scripts/linux/dev-firm.sh

set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PIDS=()

cleanup() {
  echo ""
  echo -e "\033[31mShutting down...\033[0m"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null
}
trap cleanup EXIT INT TERM

echo -e "\033[36mStarting BBSIM Firm (Broker Side)...\033[0m"

# Start API server
echo -e "\033[33m[1/2] Starting API server (port 3001)...\033[0m"
cd "$ROOT" && pnpm --filter @bbsim/api dev &
PIDS+=($!)
sleep 3

# Launch Tauri (handles Vite + native window)
echo -e "\033[33m[2/2] Launching Tauri desktop app...\033[0m"
cd "$ROOT/apps/firm"
pnpm tauri:dev
