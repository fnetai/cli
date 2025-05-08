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
 * Get service definition file path
 * @param {string} name - Service definition name
 * @returns {string} Service definition file path
 */
export function getServiceDefinitionPath(name) {
  return path.join(getServicesDirectory(), `${name}.yaml`);
}

/**
 * Check if a service definition exists
 * @param {string} name - Service definition name
 * @returns {boolean} True if the service definition exists
 */
export function serviceDefinitionExists(name) {
  const definitionPath = getServiceDefinitionPath(name);
  return fs.existsSync(definitionPath);
}

/**
 * Load a service definition
 * @param {string} name - Service definition name
 * @returns {Object|null} Service definition or null if not found
 */
export function loadServiceDefinition(name) {
  const definitionPath = getServiceDefinitionPath(name);
  
  if (!fs.existsSync(definitionPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(definitionPath, 'utf8');
    return yaml.parse(content);
  } catch (err) {
    console.warn(chalk.yellow(`Failed to parse service definition file: ${err.message}`));
    return null;
  }
}

/**
 * Save a service definition
 * @param {string} name - Service definition name
 * @param {Object} definition - Service definition
 * @returns {boolean} True if successful
 */
export function saveServiceDefinition(name, definition) {
  const definitionPath = getServiceDefinitionPath(name);
  
  try {
    const content = yaml.stringify(definition);
    fs.writeFileSync(definitionPath, content);
    return true;
  } catch (err) {
    console.error(chalk.red(`Failed to save service definition: ${err.message}`));
    return false;
  }
}

/**
 * Delete a service definition
 * @param {string} name - Service definition name
 * @returns {boolean} True if successful
 */
export function deleteServiceDefinition(name) {
  const definitionPath = getServiceDefinitionPath(name);
  
  if (!fs.existsSync(definitionPath)) {
    return false;
  }
  
  try {
    fs.unlinkSync(definitionPath);
    return true;
  } catch (err) {
    console.error(chalk.red(`Failed to delete service definition: ${err.message}`));
    return false;
  }
}

/**
 * List all service definitions
 * @returns {Array<string>} List of service definition names
 */
export function listServiceDefinitions() {
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
 * Validate a service definition
 * @param {Object} definition - Service definition
 * @returns {Object} Validation result { valid: boolean, errors: Array }
 */
export function validateServiceDefinition(definition) {
  const errors = [];
  
  // Check required fields
  if (!definition.name) {
    errors.push('Service name is required');
  }
  
  if (!definition.binary) {
    errors.push('Binary name is required');
  }
  
  // Check if binary exists
  if (definition.binary) {
    const binDir = binSystem.getBinDirectory();
    const binaryPath = path.join(binDir, definition.binary);
    
    if (!fs.existsSync(binaryPath)) {
      errors.push(`Binary '${definition.binary}' not found in bin directory`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Register a service
 * @param {string} definitionName - Service definition name
 * @param {Object} options - Registration options
 * @returns {Promise<Object>} Registration result
 */
export async function registerService(definitionName, options = {}) {
  // Load service definition
  const definition = loadServiceDefinition(definitionName);
  
  if (!definition) {
    throw new Error(`Service definition '${definitionName}' not found`);
  }
  
  // Validate service definition
  const validation = validateServiceDefinition(definition);
  
  if (!validation.valid) {
    throw new Error(`Invalid service definition: ${validation.errors.join(', ')}`);
  }
  
  // Get binary path
  const binDir = binSystem.getBinDirectory();
  const binaryPath = path.join(binDir, definition.binary);
  
  // Register service
  try {
    await manageService({
      action: 'register',
      name: definition.name,
      description: definition.description || `Service for ${definition.binary}`,
      command: [binaryPath, ...(definition.args || [])],
      env: definition.env || {},
      wdir: definition.workingDir,
      system: definition.system !== false,
      autoStart: definition.autoStart === true,
      restartOnFailure: definition.restartOnFailure !== false,
      user: definition.user
    });
    
    // Update metadata
    const metadata = loadServiceMetadata();
    metadata.services[definition.name] = {
      definition: definitionName,
      binary: definition.binary,
      registered: new Date().toISOString(),
      status: 'registered'
    };
    saveServiceMetadata(metadata);
    
    return {
      success: true,
      name: definition.name,
      definition: definitionName
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
  getServiceDefinitionPath,
  serviceDefinitionExists,
  loadServiceDefinition,
  saveServiceDefinition,
  deleteServiceDefinition,
  listServiceDefinitions,
  validateServiceDefinition,
  registerService
};
