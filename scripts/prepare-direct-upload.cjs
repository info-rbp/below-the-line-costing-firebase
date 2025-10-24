#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const artifactsRoot = path.join(projectRoot, 'artifacts');
const uploadDir = path.join(artifactsRoot, 'pages-direct-upload');
const zipPath = path.join(artifactsRoot, 'pages-direct-upload.zip');

function ensureDistExists() {
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ directory not found. Run "npm run build" before packaging.');
    process.exit(1);
  }

  const workerPath = path.join(distDir, '_worker.js');
  if (!fs.existsSync(workerPath)) {
    console.error('❌ dist/_worker.js is missing. Make sure the Worker bundle exists before packaging.');
    process.exit(1);
  }
}

function cleanPreviousArtifacts() {
  if (fs.existsSync(uploadDir)) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
  }
  if (!fs.existsSync(artifactsRoot)) {
    fs.mkdirSync(artifactsRoot, { recursive: true });
  }
  if (fs.existsSync(zipPath)) {
    fs.rmSync(zipPath);
  }
}

function copyDist() {
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.cpSync(distDir, uploadDir, { recursive: true });
}

function createZip() {
  try {
    execSync(`zip -r ${JSON.stringify(zipPath)} .`, {
      cwd: uploadDir,
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('\n❌ Failed to create ZIP archive. Make sure the "zip" CLI is available in your environment.');
    process.exit(1);
  }
}

function main() {
  ensureDistExists();
  cleanPreviousArtifacts();
  copyDist();
  createZip();

  console.log('\n✅ Direct upload bundle created successfully:');
  console.log(`  - Directory: ${uploadDir}`);
  console.log(`  - Archive:   ${zipPath}`);
  console.log('\nUpload the ZIP via the Cloudflare Pages dashboard (Direct Upload).');
  console.log('If you need to re-run, simply execute "npm run package:direct-upload" again.');
}

main();
