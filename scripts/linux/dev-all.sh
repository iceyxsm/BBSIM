#!/usr/bin/env bash
# BBSIM — Start Everything (Both Apps + API)
# Starts: API server + Firm frontend + Trader frontend + Both native shells
# Usage: ./scripts/dev-all.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIDS=()

cleanup() {
  echo ""
  echo -e "\033[31mShutting down all processes...\033[0m"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null
  echo -e "\033[32mDone.\033[0m"
}
trap cleanup EXIT INT TERM

echo -e "\033[36m========================================\033[0m"
echo -e "\033[36m  BBSIM — Full Development Environment\033[0m"
echo -e "\033[36m========================================\033[0m"
echo ""

# Start API server
echo -e "\033[33m[1/5] Starting API server (port 3001)...\033[0m"
cd "$ROOT" && pnpm --filter @bbsim/api dev &
PIDS+=($!)
sleep 2

# Start Firm Vite
echo -e "\033[33m[2/5] Starting Firm frontend (port 5173)...\033[0m"
cd "$ROOT" && pnpm --filter @bbsim/firm dev &
PIDS+=($!)
sleep 2

# Start Trader Vite
echo -e "\033[33m[3/5] Starting Trader frontend (port 5174)...\033[0m"
cd "$ROOT" && pnpm --filter @bbsim/trader dev &
PIDS+=($!)
sleep 3

# Build and launch Firm native shell in background
echo -e "\033[33m[4/5] Building Firm native shell...\033[0m"
cd "$ROOT/apps/firm" && zig build dev &
PIDS+=($!)
sleep 5

# Build and launch Trader native shell (foreground)
echo -e "\033[33m[5/5] Building Trader native shell...\033[0m"
cd "$ROOT/apps/trader"
zig build dev
