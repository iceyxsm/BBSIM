#!/usr/bin/env node

/**
 * BBSIM Trader — Launcher
 *
 * Starts the trader client. The user will be prompted to enter
 * the firm server's address on first launch.
 *
 * Usage:
 *   node desktop/trader/start.js
 *   # or from root:
 *   pnpm trader
 */

import { spawn } from 'child_process';

console.log('');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║          BBSIM — Trader Client               ║');
console.log('  ╠══════════════════════════════════════════════╣');
console.log('  ║  Opening trader interface...                  ║');
console.log('  ║  Enter the firm server address to connect.   ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

const trader = spawn('pnpm', ['dev:trader'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
});

process.on('SIGINT', () => {
  trader.kill();
  process.exit(0);
});
