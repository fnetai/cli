/**
 * Utility functions for fbin CLI
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Set up environment for fbin CLI
 */
export function setupEnvironment() {
  // Any environment setup needed for fbin CLI
}

/**
 * Get the bin directory
 * 
 * @returns {string} Path to the bin directory
 */
export function getBinDir() {
  const homeDir = os.homedir();
  const binDir = path.join(homeDir, '.fnet', 'bin');
  
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }
  
  return binDir;
}

/**
 * Get the bin registry file path
 * 
 * @returns {string} Path to the bin registry file
 */
export function getBinRegistryPath() {
  const homeDir = os.homedir();
  const fnetDir = path.join(homeDir, '.fnet');
  
  if (!fs.existsSync(fnetDir)) {
    fs.mkdirSync(fnetDir, { recursive: true });
  }
  
  return path.join(fnetDir, 'bin-registry.json');
}
