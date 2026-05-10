#!/usr/bin/env bash
# BBSIM — Start Firm (Broker) Desktop App
# Starts: API server + Vite frontend + Zig native shell
# Usage: ./scripts/dev-firm.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIDS=()

cleanup() {
  echo ""
  echo -e "\033[31mShutting down...\033[0m"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null
  echo -e "\033[32mDone.\033[0m"
}
trap cleanup EXIT INT TERM

echo -e "\033[36mStarting BBSIM Firm (Broker Side)...\033[0m"
echo ""

# Start API server in background
echo -e "\033[33m[1/3] Starting API server (port 3001)...\033[0m"
cd "$ROOT" && pnpm --filter @bbsim/api dev &
PIDS+=($!)
sleep 2

# Start Vite frontend in background
echo -e "\033[33m[2/3] Starting Vite dev server (port 5173)...\033[0m"
cd "$ROOT" && pnpm --filter @bbsim/firm dev &
PIDS+=($!)
sleep 3

# Start Zig native shell (foreground — blocks until closed)
echo -e "\033[33m[3/3] Building and launching native shell...\033[0m"
cd "$ROOT/apps/firm"
zig build dev
