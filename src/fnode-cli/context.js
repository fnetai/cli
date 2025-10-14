/**
 * Context utilities for fnode CLI
 */
import path from 'node:path';
import fs from 'node:fs';
import fnetYaml from '@fnet/yaml';
import yaml from 'yaml';
import resolveTemplatePath from '../utils/resolve-template-path.js';

/**
 * Create a context object for CLI commands
 *
 * @param {Object} argv - Command line arguments
 * @returns {Promise<Object>} Context object
 */
export async function createContext(argv) {
  if (argv.id) {
    return {
      id: argv.id,
      buildId: argv.buildId,
      mode: argv.mode,
      protocol: argv.protocol || 'ac:',
      templateDir: resolveTemplatePath('./template/fnode/node'),
      projectDir: path.resolve(process.cwd(), `./.output/${argv.id}`),
      tags: argv.ftag,
      dev: argv.dev
    };
  } else {
    try {
      const project = await loadProject({ tags: argv.ftag });
      const template = project.runtime.type === 'bun' ? 'node' : project.runtime.type;
      return {
        buildId: argv.buildId,
        mode: argv.mode,
        protocol: argv.protocol || 'src:',
        templateDir: resolveTemplatePath(`./template/fnode/${template}`),
        projectDir: path.resolve(project.projectDir, './.workspace'),
        projectSrcDir: path.resolve(project.projectDir, './src'),
        project,
        tags: argv.ftag,
        dev: argv.dev
      };
    } catch (error) {
      // If project loading fails, return a minimal context
      console.warn(`Warning: Could not load project: ${error.message}`);
      return {
        projectDir: process.cwd(),
        tags: argv.ftag
      };
    }
  }
}

/**
 * Load project information
 *
 * @param {Object} options - Options
 * @param {Array} options.tags - Tags for conditional configuration
 * @returns {Promise<Object>} Project information
 */
async function loadProject({ tags }) {
  let projectFilePath = findProjectFile(process.cwd());
  if (!fs.existsSync(projectFilePath)) {
    throw new Error('fnode.yaml file not found in current directory.');
  }

  const { raw, parsed } = await fnetYaml({
    file: projectFilePath,
    tags
  });

  const projectDir = path.dirname(projectFilePath);

  // Set up features
  parsed.features = parsed.features || {};
  const features = parsed.features;
  features.runtime = features.runtime || {};
  features.runtime.type = features.runtime.type || 'node';

  // Set up runtime template
  if (features.runtime.type === 'python') {
    features.runtime.template = features.runtime.template || 'python';
  } else if (features.runtime.type === 'bun') {
    features.runtime.template = features.runtime.template || 'node';
  } else {
    features.runtime.template = features.runtime.template || 'node';
  }

  // Create project object
  const project = {
    libraryAtom: {
      doc: { ...parsed },
      fileName: 'index'
    },
    projectDir,
    projectFilePath,
    projectFileContent: raw,
    projectFileParsed: parsed,
    runtime: features.runtime
  };

  // Check for targets file
  let targetsPath = path.resolve(projectDir, 'fnet/targets.yaml');
  if (!fs.existsSync(targetsPath)) {
    targetsPath = path.resolve(projectDir, 'node.devops.yaml');
    if (fs.existsSync(targetsPath)) {
      // Migrate old targets file
      const fnetDir = path.resolve(projectDir, 'fnet');
      if (!fs.existsSync(fnetDir)) {
        fs.mkdirSync(fnetDir);
      }
      fs.copyFileSync(targetsPath, path.resolve(projectDir, 'fnet/targets.yaml'));
      fs.unlinkSync(targetsPath);
    }
  }

  // Load targets file if it exists
  if (fs.existsSync(targetsPath)) {
    const { raw, parsed } = await fnetYaml({
      file: targetsPath,
      tags
    });
    const yamlDocument = yaml.parseDocument(raw);
    project.devops = {
      filePath: targetsPath,
      fileContent: raw,
      yamlDocument,
      doc: { ...parsed },
      type: 'library.deploy',
      save: async () => {
        fs.writeFileSync(project.devops.filePath, yamlDocument.toString());
      }
    };
  }

  // Check for readme file
  const readmePath = path.resolve(projectDir, 'readme.md');
  if (fs.existsSync(readmePath)) {
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    project.readme = {
      filePath: readmePath,
      fileContent: readmeContent,
      doc: {
        content: readmeContent,
        'content-type': 'markdown'
      },
      type: 'wiki'
    };
  }

  return project;
}

/**
 * Find project file in directory
 *
 * @param {string} dir - Directory to search in
 * @returns {string} Path to project file
 */
function findProjectFile(dir) {
  const nodePath = path.resolve(dir, 'node.yaml');
  const fnodePath = path.resolve(dir, 'fnode.yaml');

  if (fs.existsSync(fnodePath)) {
    return fnodePath;
  }

  if (fs.existsSync(nodePath)) {
    try {
      // Migrate node.yaml to fnode.yaml
      const content = fs.readFileSync(nodePath, 'utf8');
      fs.writeFileSync(fnodePath, content, 'utf8');
      fs.unlinkSync(nodePath);
      console.log(`Migrated node.yaml to fnode.yaml in ${dir}`);
      return fnodePath;
    } catch (error) {
      console.error(`Error migrating node.yaml to fnode.yaml: ${error.message}`);
      return nodePath;
    }
  }

  return fnodePath;
}


