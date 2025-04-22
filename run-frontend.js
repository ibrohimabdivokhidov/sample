#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting frontend-only application...');

// Check if we have the frontend routes file
if (!fs.existsSync('server/routes.ts.frontend')) {
  console.error('❌ Frontend routes file not found!');
  process.exit(1);
}

// Backup the original routes file if needed
if (!fs.existsSync('server/routes.ts.original')) {
  console.log('📦 Backing up original routes file...');
  fs.copyFileSync('server/routes.ts', 'server/routes.ts.original');
}

// Replace routes with frontend-only version
console.log('🔄 Switching to frontend-only mode...');
fs.copyFileSync('server/routes.ts.frontend', 'server/routes.ts');

// Start the server
try {
  console.log('🌐 Starting the server...');
  execSync('npm run dev', { stdio: 'inherit' });
} finally {
  // Restore original routes file when done
  console.log('🔄 Restoring original routes file...');
  if (fs.existsSync('server/routes.ts.original')) {
    fs.copyFileSync('server/routes.ts.original', 'server/routes.ts');
  }
}