/**
 * Context utilities for fnet CLI
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
  // if (argv.id) {
  //   return {
  //     id: argv.id,
  //     buildId: argv.buildId,
  //     mode: argv.mode,
  //     protocol: argv.protocol || 'ac:',
  //     templateDir: resolveTemplatePath('./template/fnet/node'),
  //     coreDir: resolveTemplatePath('./template/fnet/core'),
  //     projectDir: path.resolve(process.cwd(), `./.output/${argv.id}`),
  //     tags: argv.ftag,
  //     dev: argv.dev
  //   };
  // } else {
  try {
    const project = await loadProject({ tags: argv.ftag, flowsPath: argv.flows });
    return {
      buildId: argv.buildId,
      mode: argv.mode,
      protocol: argv.protocol || 'src:',
      templateDir: resolveTemplatePath(`./template/fnet/node`),
      coreDir: resolveTemplatePath('./template/fnet/core'),
      projectDir: path.resolve(project.projectDir, './.workspace'),

      projectSrcDir: path.resolve(project.projectDir, './src'),
      projectSrcDirSymlink: path.resolve(project.projectDir, './.workspace/src-core'),

      projectAppDir: path.resolve(project.projectDir, './app'),
      projectAppDirSymlink: path.resolve(project.projectDir, './.workspace/app'),

      projectCliDir: path.resolve(project.projectDir, './cli'),
      projectCliDirSymlink: path.resolve(project.projectDir, './.workspace/cli'),

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
  // }
}

/**
 * Load project information
 *
 * @param {Object} options - Options
 * @param {Array} options.tags - Tags for conditional configuration
 * @param {string} options.flowsPath - Optional path to flows file
 * @returns {Promise<Object>} Project information
 */
async function loadProject({ tags, flowsPath }) {
  let projectFilePath = findProjectFile(process.cwd());
  if (!fs.existsSync(projectFilePath)) {
    throw new Error('fnet.yaml file not found in current directory.');
  }

  const { raw: projectFileContent, parsed: projectFileParsed } = await fnetYaml({
    file: projectFilePath,
    tags
  });

  const projectDir = path.dirname(projectFilePath);

  // Set up features
  projectFileParsed.features = projectFileParsed.features || {};
  const features = projectFileParsed.features;
  features.runtime = features.runtime || {};
  features.runtime.type = features.runtime.type || 'node';

  // Process flows content
  let flowsContent;

  if (flowsPath) {
    // Use explicitly provided flows path
    const resolvedFlowsPath = path.resolve(projectDir, flowsPath);
    if (!fs.existsSync(resolvedFlowsPath)) {
      throw new Error(`Flows file not found: ${resolvedFlowsPath}`);
    }
    const { parsed: flowsParsed } = await fnetYaml({
      file: resolvedFlowsPath,
      tags
    });
    flowsContent = flowsParsed;
  } else if (typeof projectFileParsed.flows === 'object') {
    flowsContent = projectFileParsed.flows;
  } else {
    let defaultFlowsFile = 'flow.main.yaml';

    if (fs.existsSync(path.join(projectDir, 'fnet', 'flows.yaml'))) {
      defaultFlowsFile = path.join('fnet', 'flows.yaml');
    }

    const mainFileName = projectFileParsed.main || defaultFlowsFile;
    let projectMainFilePath = path.resolve(projectDir, mainFileName);

    if (!fs.existsSync(projectMainFilePath)) {
      flowsContent = { main: { steps: [] } };
    } else {
      const { parsed: projectMainFileParsed } = await fnetYaml({
        file: projectMainFilePath,
        tags
      });
      flowsContent = projectMainFileParsed;
    }
  }

  // Create workflow atom
  const workflowAtom = {
    doc: {
      ...projectFileParsed,
      content: flowsContent
    }
  };

  // Create project object
  const project = {
    workflowAtom,
    projectDir,
    projectFilePath,
    projectFileContent,
    projectFileParsed,
    runtime: features.runtime
  };

  // Check for targets file
  let targetsPath = path.resolve(projectDir, 'fnet/targets.yaml');
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
      type: 'workflow.deploy',
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
 * Searches for fnet.yaml first, then fnet.yml
 *
 * @param {string} dir - Directory to search in
 * @returns {string} Path to project file
 */
function findProjectFile(dir) {
  const yamlPath = path.resolve(dir, 'fnet.yaml');
  if (fs.existsSync(yamlPath)) {
    return yamlPath;
  }

  const ymlPath = path.resolve(dir, 'fnet.yml');
  if (fs.existsSync(ymlPath)) {
    return ymlPath;
  }

  // Return .yaml path as default (error handling will occur in caller)
  return yamlPath;
}


