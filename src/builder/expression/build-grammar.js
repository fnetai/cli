#!/usr/bin/env node

/**
 * Build script for Flownet CLI Expression Grammar
 * Compiles grammar.pegjs to grammar.js
 */

import { readFileSync, writeFileSync } from 'fs';
import peggy from 'peggy';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const { generate } = peggy;

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read grammar file from current directory
const grammarPath = resolve(__dirname, 'grammar.pegjs');
const grammarSource = readFileSync(grammarPath, 'utf-8');

console.log('📝 Compiling Flownet CLI expression grammar...');

// Generate parser
const parser = generate(grammarSource, {
  output: 'source',
  format: 'es',
  trace: false
});

// Write to output in same directory
const outputPath = resolve(__dirname, 'grammar.js');
writeFileSync(outputPath, parser, 'utf-8');

console.log('✅ Grammar compiled successfully!');
console.log(`   Output: ${outputPath}`);

