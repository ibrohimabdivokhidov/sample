#!/usr/bin/env node

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const command = 'npx vite client --config client/vite.config.standalone.ts';

console.log('Starting frontend-only application...');
console.log('Running command:', command);

const child = exec(command);

child.stdout.on('data', (data) => {
  console.log(data);
});

child.stderr.on('data', (data) => {
  console.error(data);
});

child.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
});