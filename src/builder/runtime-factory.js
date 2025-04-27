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
    // If no project is provided, default to node runtime
    if (!context.project) {
      console.warn('No project provided, defaulting to node runtime');
      const NodeBuilder = (await import('./lib-builder-node.js')).default;
      return new NodeBuilder(context);
    }

    // Get the runtime type from the project
    const runtimeType = context.project?.runtime?.type || 'node';

    try {
      // Try to load the runtime-specific builder
      const BuilderClass = await this.loadBuilderClass(runtimeType);
      return new BuilderClass(context);
    } catch (error) {
      console.warn(`Warning: Could not load builder for runtime '${runtimeType}'. Falling back to node builder.`);
      console.warn(`Error: ${error.message}`);

      // Fall back to the node builder as default
      const NodeBuilder = (await import('./lib-builder-node.js')).default;
      return new NodeBuilder(context);
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
