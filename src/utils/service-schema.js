/**
 * Service definition schema
 * This module provides the JSON schema for service definitions
 */
import fs from 'node:fs';
import binSystem from './bin-system.js';

/**
 * Get the service definition schema
 * @param {boolean} includeDynamicChoices - Whether to include dynamic choices for binaries
 * @returns {Object} Service definition schema
 */
export function getServiceManifestSchema(includeDynamicChoices = true) {
  // Get available binaries for the binary selection prompt
  let binaryChoices = [];

  if (includeDynamicChoices) {
    try {
      const binDir = binSystem.getBinDirectory();
      const metadataFile = binSystem.getMetadataFilePath();

      if (fs.existsSync(metadataFile)) {
        const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        binaryChoices = Object.keys(metadata.binaries).map(name => ({
          name,
          message: `${name} (${metadata.binaries[name].version || 'unknown'})`
        }));
      } else if (fs.existsSync(binDir)) {
        binaryChoices = fs.readdirSync(binDir).map(name => ({
          name,
          message: name
        }));
      }
    } catch (err) {
      console.warn(`Failed to get binary choices: ${err.message}`);
    }
  }

  // Service definition schema
  return {
    type: "object",
    required: ["name", "binary"],
    properties: {
      name: {
        type: "string",
        description: "Service name",
        "x-prompt": {
          type: "input",
          message: "Enter service name:"
        }
      },
      binary: {
        type: "string",
        description: "Binary name in the bin directory",
        "x-prompt": {
          type: "select",
          message: "Select binary:",
          choices: binaryChoices
        }
      },
      description: {
        type: "string",
        description: "Service description",
        "x-prompt": {
          type: "input",
          message: "Enter service description:"
        }
      },
      args: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Command line arguments",
        "x-prompt": {
          type: "input",
          message: "Enter command line arguments (space-separated):",
          result: value => value ? value.split(' ') : []
        }
      },
      env: {
        type: "object",
        additionalProperties: {
          type: "string"
        },
        description: "Environment variables",
        "x-prompt": {
          type: "input",
          message: "Enter environment variables (KEY=VALUE format, one per line):",
          result: value => {
            if (!value) return {};
            return value.split('\n')
              .filter(line => line.includes('='))
              .reduce((obj, line) => {
                const [key, ...valueParts] = line.split('=');
                obj[key.trim()] = valueParts.join('=').trim();
                return obj;
              }, {});
          }
        }
      },
      workingDir: {
        type: "string",
        description: "Working directory",
        "x-prompt": {
          type: "input",
          message: "Enter working directory (optional):"
        }
      },
      autoStart: {
        type: "boolean",
        description: "Start on boot",
        default: false,
        "x-prompt": {
          type: "confirm",
          message: "Start service on boot?",
          initial: false
        }
      },
      restartOnFailure: {
        type: "boolean",
        description: "Restart on failure",
        default: true,
        "x-prompt": {
          type: "confirm",
          message: "Restart service on failure?",
          initial: true
        }
      },
      system: {
        type: "boolean",
        description: "System service",
        default: true,
        "x-prompt": {
          type: "confirm",
          message: "Register as system service?",
          initial: true
        }
      },
      user: {
        type: "string",
        description: "User to run the service as",
        "x-prompt": {
          type: "input",
          message: "Enter user to run the service as (optional):"
        }
      },
      instances: {
        type: "integer",
        description: "Number of instances to run",
        default: 1,
        minimum: 1,
        "x-prompt": {
          type: "number",
          message: "Enter number of instances to run:",
          initial: 1
        }
      },
      metadata: {
        type: "object",
        additionalProperties: true,
        description: "Custom metadata"
      }
    }
  };
}

export default {
  getServiceManifestSchema
};
