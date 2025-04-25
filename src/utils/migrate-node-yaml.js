import fs from 'node:fs';
import path from 'node:path';

/**
 * Migrates node.yaml to fnode.yaml for backward compatibility
 * @param {string} projectDir - The project directory
 * @returns {string} - The path to the config file that was used
 */
export default function migrateNodeYaml(projectDir) {
  const nodeYamlPath = path.resolve(projectDir, 'node.yaml');
  const fnodeYamlPath = path.resolve(projectDir, 'fnode.yaml');

  // If fnode.yaml already exists, use it
  if (fs.existsSync(fnodeYamlPath)) {
    return fnodeYamlPath;
  }

  // If node.yaml exists, rename it to fnode.yaml
  if (fs.existsSync(nodeYamlPath)) {
    try {
      // Read the content of node.yaml
      const content = fs.readFileSync(nodeYamlPath, 'utf8');

      // Write the content to fnode.yaml
      fs.writeFileSync(fnodeYamlPath, content, 'utf8');

      // Delete the old node.yaml file
      fs.unlinkSync(nodeYamlPath);

      console.log(`Migrated node.yaml to fnode.yaml in ${projectDir}`);

      return fnodeYamlPath;
    } catch (err) {
      console.error(`Error migrating node.yaml to fnode.yaml: ${err.message}`);
      // If migration fails, fall back to node.yaml
      return nodeYamlPath;
    }
  }

  // If neither exists, return the fnode.yaml path (which doesn't exist)
  return fnodeYamlPath;
}
