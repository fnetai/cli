/**
 * Context utilities for fservice CLI
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import serviceSystem from '../utils/service-system.js';

/**
 * Create a context object for CLI commands
 * 
 * @param {Object} argv - Command line arguments
 * @returns {Promise<Object>} Context object
 */
export async function createContext(argv) {
  // Ensure service directory structure exists
  await serviceSystem.createServiceDirectoryStructure();
  
  // Get service directories
  const servicesDir = serviceSystem.getServicesDirectory();
  const metadataDir = serviceSystem.getServiceMetadataDirectory();
  
  // Load service metadata
  const metadata = serviceSystem.loadServiceMetadata();
  
  return {
    servicesDir,
    metadataDir,
    metadata,
    args: argv
  };
}

export default {
  createContext
};
