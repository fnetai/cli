/**
 * Service system utilities
 * This module provides utilities for managing the service system
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import chalk from 'chalk';
import yaml from 'yaml';
import manageService from '@fnet/service';
import binSystem from './bin-system.js';

/**
 * Get the services directory path
 * @returns {string} Services directory path
 */
export function getServicesDirectory() {
  return path.join(os.homedir(), '.fnet', 'services');
}

/**
 * Get the service metadata directory path
 * @returns {string} Service metadata directory path
 */
export function getServiceMetadataDirectory() {
  return path.join(os.homedir(), '.fnet', 'metadata');
}

/**
 * Get the service metadata file path
 * @returns {string} Service metadata file path
 */
export function getServiceMetadataFilePath() {
  return path.join(getServiceMetadataDirectory(), 'services.json');
}

/**
 * Create the service directory structure
 * @returns {Promise<void>}
 */
export async function createServiceDirectoryStructure() {
  const servicesDir = getServicesDirectory();
  const metadataDir = getServiceMetadataDirectory();
  const metadataFile = getServiceMetadataFilePath();

  // Create services directory
  if (!fs.existsSync(servicesDir)) {
    fs.mkdirSync(servicesDir, { recursive: true });
  }

  // Create metadata directory
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }

  // Initialize metadata file if it doesn't exist
  if (!fs.existsSync(metadataFile)) {
    fs.writeFileSync(metadataFile, JSON.stringify({
      services: {},
      lastUpdated: new Date().toISOString()
    }, null, 2));
  }
}

/**
 * Load service metadata
 * @returns {Object} Service metadata
 */
export function loadServiceMetadata() {
  const metadataFile = getServiceMetadataFilePath();
  
  if (!fs.existsSync(metadataFile)) {
    return { services: {}, lastUpdated: new Date().toISOString() };
  }
  
  try {
    return JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
  } catch (err) {
    console.warn(chalk.yellow(`Failed to parse service metadata file: ${err.message}`));
    return { services: {}, lastUpdated: new Date().toISOString() };
  }
}

/**
 * Save service metadata
 * @param {Object} metadata - Service metadata
 * @returns {void}
 */
export function saveServiceMetadata(metadata) {
  const metadataFile = getServiceMetadataFilePath();
  metadata.lastUpdated = new Date().toISOString();
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
}

/**
 * Get service manifest file path
 * @param {string} name - Service manifest name
 * @returns {string} Service manifest file path
 */
export function getServiceManifestPath(name) {
  return path.join(getServicesDirectory(), `${name}.yaml`);
}

/**
 * Check if a service manifest exists
 * @param {string} name - Service manifest name
 * @returns {boolean} True if the service manifest exists
 */
export function servicManifestExists(name) {
  const definitionPath = getServiceManifestPath(name);
  return fs.existsSync(definitionPath);
}

/**
 * Load a service manifest
 * @param {string} name - Service manifest name
 * @returns {Object|null} Service manifest or null if not found
 */
export function loadServiceManifest(name) {
  const definitionPath = getServiceManifestPath(name);
  
  if (!fs.existsSync(definitionPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(definitionPath, 'utf8');
    return yaml.parse(content);
  } catch (err) {
    console.warn(chalk.yellow(`Failed to parse service manifest file: ${err.message}`));
    return null;
  }
}

/**
 * Save a service manifest
 * @param {string} name - Service manifest name
 * @param {Object} manifest - Service manifest
 * @returns {boolean} True if successful
 */
export function saveServiceManifest(name, manifest) {
  const definitionPath = getServiceManifestPath(name);
  
  try {
    const content = yaml.stringify(manifest);
    fs.writeFileSync(definitionPath, content);
    return true;
  } catch (err) {
    console.error(chalk.red(`Failed to save service manifest: ${err.message}`));
    return false;
  }
}

/**
 * Delete a service manifest
 * @param {string} name - Service manifest name
 * @returns {boolean} True if successful
 */
export function deleteServiceManifest(name) {
  const definitionPath = getServiceManifestPath(name);
  
  if (!fs.existsSync(definitionPath)) {
    return false;
  }
  
  try {
    fs.unlinkSync(definitionPath);
    return true;
  } catch (err) {
    console.error(chalk.red(`Failed to delete service manifest: ${err.message}`));
    return false;
  }
}

/**
 * List all service definitions
 * @returns {Array<string>} List of service manifest names
 */
export function listServiceManifests() {
  const servicesDir = getServicesDirectory();
  
  if (!fs.existsSync(servicesDir)) {
    return [];
  }
  
  try {
    return fs.readdirSync(servicesDir)
      .filter(file => file.endsWith('.yaml'))
      .map(file => file.replace('.yaml', ''));
  } catch (err) {
    console.error(chalk.red(`Failed to list service definitions: ${err.message}`));
    return [];
  }
}

/**
 * Validate a service manifest
 * @param {Object} manifest - Service manifest
 * @returns {Object} Validation result { valid: boolean, errors: Array }
 */
export function validateServiceManifest(manifest) {
  const errors = [];
  
  // Check required fields
  if (!manifest.name) {
    errors.push('Service name is required');
  }
  
  if (!manifest.binary) {
    errors.push('Binary name is required');
  }
  
  // Check if binary exists
  if (manifest.binary) {
    const binDir = binSystem.getBinDirectory();
    const binaryPath = path.join(binDir, manifest.binary);
    
    if (!fs.existsSync(binaryPath)) {
      errors.push(`Binary '${manifest.binary}' not found in bin directory`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Register a service
 * @param {string} manifestName - Service manifest name
 * @param {Object} options - Registration options
 * @returns {Promise<Object>} Registration result
 */
export async function registerService(manifestName, options = {}) {
  // Load service manifest
  const manifest = loadServiceManifest(manifestName);
  
  if (!manifest) {
    throw new Error(`Service manifest '${manifestName}' not found`);
  }
  
  // Validate service manifest
  const validation = validateServiceManifest(manifest);
  
  if (!validation.valid) {
    throw new Error(`Invalid service manifest: ${validation.errors.join(', ')}`);
  }
  
  // Get binary path
  const binDir = binSystem.getBinDirectory();
  const binaryPath = path.join(binDir, manifest.binary);
  
  // Register service
  try {
    await manageService({
      action: 'register',
      name: manifest.name,
      description: manifest.description || `Service for ${manifest.binary}`,
      command: [binaryPath, ...(manifest.args || [])],
      env: manifest.env || {},
      wdir: manifest.workingDir,
      system: manifest.system !== false,
      autoStart: manifest.autoStart === true,
      restartOnFailure: manifest.restartOnFailure !== false,
      user: manifest.user
    });
    
    // Update metadata
    const metadata = loadServiceMetadata();
    metadata.services[manifest.name] = {
      manifest: manifestName,
      binary: manifest.binary,
      registered: new Date().toISOString(),
      status: 'registered'
    };
    saveServiceMetadata(metadata);
    
    return {
      success: true,
      name: manifest.name,
      manifest: manifestName
    };
  } catch (err) {
    throw new Error(`Failed to register service: ${err.message}`);
  }
}

export default {
  getServicesDirectory,
  getServiceMetadataDirectory,
  getServiceMetadataFilePath,
  createServiceDirectoryStructure,
  loadServiceMetadata,
  saveServiceMetadata,
  getServiceManifestPath,
  servicManifestExists,
  loadServiceManifest,
  saveServiceManifest,
  deleteServiceManifest,
  listServiceManifests,
  validateServiceManifest,
  registerService
};
