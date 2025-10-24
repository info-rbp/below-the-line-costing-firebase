#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'cloudflare-build');
const distDir = path.join(projectRoot, 'dist');

function ensureSourceExists() {
  if (!fs.existsSync(sourceDir)) {
    console.error('❌ Missing cloudflare-build/ directory.');
    console.error('   This directory must contain the precompiled Worker bundle and static assets.');
    process.exit(1);
  }
}

function cleanDist() {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
}

function copySourceToDist() {
  fs.cpSync(sourceDir, distDir, { recursive: true });
}

function main() {
  ensureSourceExists();
  cleanDist();
  copySourceToDist();
  console.log('✅ Copied cloudflare build assets into dist/');
}

main();
