#!/usr/bin/env node

/**
 * BBSIM Firm — Launcher
 *
 * Starts the API server and opens the firm dashboard.
 * Run this on the host machine. Traders connect to this machine's IP:3001.
 *
 * Usage:
 *   node desktop/firm/start.js
 *   # or from root:
 *   pnpm firm
 */

import { spawn } from 'child_process';
import { networkInterfaces } from 'os';

function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getLocalIP();

console.log('');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║          BBSIM — Firm Server                 ║');
console.log('  ╠══════════════════════════════════════════════╣');
console.log(`  ║  API:        http://${localIP}:3001        ║`);
console.log(`  ║  Dashboard:  http://localhost:5173           ║`);
console.log('  ║                                              ║');
console.log('  ║  Tell traders to connect to:                 ║');
console.log(`  ║  → ${localIP}:3001                         ║`);
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

// Start API server
const api = spawn('pnpm', ['dev:api'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
});

// Start firm frontend
const firm = spawn('pnpm', ['dev:firm'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
});

process.on('SIGINT', () => {
  api.kill();
  firm.kill();
  process.exit(0);
});
