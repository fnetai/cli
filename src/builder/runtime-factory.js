/**
 * Factory for creating runtime-specific builders
 * This factory detects the runtime type and creates the appropriate builder
 */
class RuntimeFactory {
  /**
   * Create a builder for the specified runtime
   * @param {Object} context - Project context
   * @returns {Promise<Object>} Runtime-specific builder instance
   */
  static async createBuilder(context) {
    // If no project is provided, use the legacy builder
    if (!context.project) {
      const LegacyBuilder = (await import('./lib-builder.js')).default;
      return new LegacyBuilder(context);
    }

    // Get the runtime type from the project
    const runtimeType = context.project?.runtime?.type || 'node';

    try {
      // Try to load the runtime-specific builder
      const BuilderClass = await this.loadBuilderClass(runtimeType);
      return new BuilderClass(context);
    } catch (error) {
      console.warn(`Warning: Could not load builder for runtime '${runtimeType}'. Falling back to legacy builder.`);
      console.warn(`Error: ${error.message}`);
      
      // Fall back to the legacy builder
      const LegacyBuilder = (await import('./lib-builder.js')).default;
      return new LegacyBuilder(context);
    }
  }

  /**
   * Load the builder class for the specified runtime
   * @param {string} runtimeType - Runtime type (node, python, bun, etc.)
   * @returns {Promise<Function>} Builder class
   * @private
   */
  static async loadBuilderClass(runtimeType) {
    switch (runtimeType.toLowerCase()) {
      case 'node':
        return (await import('./lib-builder-node.js')).default;
      case 'python':
        return (await import('./lib-builder-python.js')).default;
      case 'bun':
        return (await import('./lib-builder-bun.js')).default;
      default:
        throw new Error(`Unsupported runtime type: ${runtimeType}`);
    }
  }
}

export default RuntimeFactory;
