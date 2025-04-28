import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import chalk from 'chalk';
// import { createContext } from './context.js';
import fnetPrompt from '@fnet/prompt';

// Base directory for express projects
const EXPRESS_BASE_DIR = path.join(os.homedir(), '.fnet', 'express');

/**
 * Express command handler
 * Creates and manages express projects in ~/.fnet/express directory
 */
export async function expressCmd(yargs) {
  yargs
    .command(
      ['$0 [project-name]', 'create [project-name]'],
      'Create a new express project',
      (yargs) => {
        return yargs
          .positional('project-name', {
            describe: 'Name of the project',
            type: 'string'
          })
          .option('yes', {
            alias: 'y',
            describe: 'Skip all prompts and use defaults',
            type: 'boolean',
            default: false
          })
          .option('runtime', {
            describe: 'Runtime to use (node, python, bun)',
            type: 'string',
            choices: ['node', 'python', 'bun'],
            default: 'node'
          });
      },
      async (argv) => {
        await handleExpressCreate(argv);
      }
    )
    .command(
      'list',
      'List express projects',
      (yargs) => {
        return yargs
          .option('today', {
            describe: 'Show only projects created today',
            type: 'boolean',
            default: false
          })
          .option('type', {
            describe: 'Filter by project type (fnode or fnet)',
            type: 'string',
            choices: ['fnode', 'fnet']
          })
          .option('name', {
            describe: 'Filter by project name',
            type: 'string'
          });
      },
      async (argv) => {
        await handleExpressList(argv);
      }
    )
    .command(
      'open [project-name]',
      'Open an express project',
      (yargs) => {
        return yargs
          .positional('project-name', {
            describe: 'Name of the project to open',
            type: 'string'
          })
          .option('latest', {
            describe: 'Open the most recent project',
            type: 'boolean',
            default: false
          });
      },
      async (argv) => {
        await handleExpressOpen(argv);
      }
    )
    .command(
      'move [project-name] [destination]',
      'Move an express project to a real project location',
      (yargs) => {
        return yargs
          .positional('project-name', {
            describe: 'Name of the project to move',
            type: 'string'
          })
          .positional('destination', {
            describe: 'Destination directory',
            type: 'string'
          })
          .option('latest', {
            describe: 'Move the most recent project',
            type: 'boolean',
            default: false
          });
      },
      async (argv) => {
        await handleExpressMove(argv);
      }
    )
    .demandCommand(1, 'You need to specify a command')
    .help();
}

/**
 * Handle express create command
 */
async function handleExpressCreate(argv) {
  try {
    // Ensure express base directory exists
    if (!fs.existsSync(EXPRESS_BASE_DIR)) {
      fs.mkdirSync(EXPRESS_BASE_DIR, { recursive: true });
    }

    // Get today's date in YYYYMMDD format
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const todayDir = path.join(EXPRESS_BASE_DIR, today);

    // Ensure today's directory exists
    if (!fs.existsSync(todayDir)) {
      fs.mkdirSync(todayDir, { recursive: true });
    }

    // Determine project name
    let projectName = argv.projectName;
    let projectDir;

    if (!projectName) {
      // Auto-generate project name if not provided
      const existingProjects = fs.readdirSync(todayDir)
        .filter(name => name.startsWith('fnode-'))
        .map(name => parseInt(name.replace('fnode-', ''), 10))
        .filter(num => !isNaN(num));

      const nextNumber = existingProjects.length > 0
        ? Math.max(...existingProjects) + 1
        : 1;

      projectName = `fnode-${nextNumber}`;
      projectDir = path.join(todayDir, projectName);
    } else {
      // Check if project name already exists
      projectDir = path.join(todayDir, projectName);

      if (fs.existsSync(projectDir)) {
        // Find next available number for this name
        let counter = 1;
        while (fs.existsSync(path.join(todayDir, `${projectName}-${counter}`))) {
          counter++;
        }
        projectName = `${projectName}-${counter}`;
        projectDir = path.join(todayDir, projectName);
      }
    }

    // Interactive mode if not using --yes flag
    if (!argv.yes) {
      const answers = await fnetPrompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Create express project "${projectName}" in ${projectDir}?`,
          default: true
        }
      ]);

      if (!answers.proceed) {
        console.log(chalk.yellow('Project creation cancelled.'));
        return;
      }
    }

    console.log(chalk.blue(`Creating express project "${projectName}" in ${projectDir}...`));

    // Get the parent directory and project name
    const parentDir = path.dirname(projectDir);
    const projectNameOnly = path.basename(projectDir);

    // Create the project using the existing create command
    const createArgs = ['create', '--name', projectNameOnly];

    if (argv.runtime) {
      createArgs.push('--runtime', argv.runtime);
    }

    if (argv.yes) {
      createArgs.push('--yes');
    }

    // Ensure parent directory exists
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const createProcess = spawn('fnode', createArgs, {
      stdio: 'inherit',
      shell: true,
      cwd: parentDir // Set working directory to parent directory
    });

    return new Promise((resolve, reject) => {
      createProcess.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green(`\nExpress project "${projectName}" created successfully!`));
          console.log(chalk.blue(`\nProject location: ${projectDir}`));

          // Offer to open the project in an IDE
          if (!argv.yes) {
            offerToOpenInIDE(projectDir);
          } else {
            resolve();
          }
        } else {
          console.error(chalk.red(`\nFailed to create express project "${projectName}".`));
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
  } catch (error) {
    console.error(chalk.red(`Error creating express project: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Handle express list command
 */
async function handleExpressList(argv) {
  try {
    // Ensure express base directory exists
    if (!fs.existsSync(EXPRESS_BASE_DIR)) {
      console.log(chalk.yellow('No express projects found.'));
      return;
    }

    // Get all date directories
    const dateDirs = fs.readdirSync(EXPRESS_BASE_DIR)
      .filter(name => /^\d{8}$/.test(name)) // Only include YYYYMMDD format directories
      .sort((a, b) => b.localeCompare(a)); // Sort in descending order (newest first)

    // Filter by today if requested
    if (argv.today) {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const todayIndex = dateDirs.indexOf(today);
      if (todayIndex === -1) {
        console.log(chalk.yellow('No express projects found for today.'));
        return;
      }
      dateDirs.splice(0, todayIndex);
      dateDirs.splice(1); // Keep only today
    }

    // Collect all projects
    const projects = [];

    for (const dateDir of dateDirs) {
      const datePath = path.join(EXPRESS_BASE_DIR, dateDir);
      const projectNames = fs.readdirSync(datePath);

      for (const projectName of projectNames) {
        const projectPath = path.join(datePath, projectName);
        const stats = fs.statSync(projectPath);

        // Determine project type
        let projectType = 'unknown';
        if (projectName.startsWith('fnode-') || fs.existsSync(path.join(projectPath, 'fnode.yaml'))) {
          projectType = 'fnode';
        } else if (projectName.startsWith('fnet-') || fs.existsSync(path.join(projectPath, 'fnet.yaml'))) {
          projectType = 'fnet';
        }

        // Apply type filter if specified
        if (argv.type && projectType !== argv.type) {
          continue;
        }

        // Apply name filter if specified
        if (argv.name && !projectName.includes(argv.name)) {
          continue;
        }

        // Format date as YYYY-MM-DD
        const formattedDate = `${dateDir.slice(0, 4)}-${dateDir.slice(4, 6)}-${dateDir.slice(6, 8)}`;

        projects.push({
          name: projectName,
          type: projectType,
          date: formattedDate,
          path: projectPath,
          created: stats.birthtime
        });
      }
    }

    // Sort projects by creation date (newest first)
    projects.sort((a, b) => b.created - a.created);

    if (projects.length === 0) {
      console.log(chalk.yellow('No express projects found matching the criteria.'));
      return;
    }

    // Display projects
    console.log(chalk.blue('\nExpress Projects:'));
    console.log(chalk.blue('=================\n'));

    // Create a table with clean paths
    const table = projects.map(project => {
      // Replace home directory with ~ for cleaner display
      let displayPath = project.path;
      if (displayPath.startsWith(os.homedir())) {
        displayPath = '~' + displayPath.substring(os.homedir().length);
      }

      return {
        Name: project.name,
        Type: project.type,
        Date: project.date,
        Path: displayPath
      };
    });

    // Display the table
    console.table(table);

    // Add color to the output by displaying a colored summary
    console.log(
      chalk.green('Projects: ') +
      chalk.yellow(projects.filter(p => p.type === 'fnode').length + ' fnode, ') +
      chalk.cyan(projects.filter(p => p.type === 'fnet').length + ' fnet')
    );
    console.log(chalk.blue(`\nTotal: ${projects.length} projects`));
  } catch (error) {
    console.error(chalk.red(`Error listing express projects: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Handle express open command
 */
async function handleExpressOpen(argv) {
  try {
    // Ensure express base directory exists
    if (!fs.existsSync(EXPRESS_BASE_DIR)) {
      console.log(chalk.yellow('No express projects found.'));
      return;
    }

    let projectPath;

    // If --latest flag is used, find the most recent project
    if (argv.latest) {
      projectPath = await findLatestProject();
      if (!projectPath) {
        console.log(chalk.yellow('No express projects found.'));
        return;
      }
    }
    // If project name is provided, find that project
    else if (argv.projectName) {
      projectPath = await findProjectByName(argv.projectName);
      if (!projectPath) {
        console.log(chalk.yellow(`Project "${argv.projectName}" not found.`));
        return;
      }
    }
    // Otherwise, show a list of projects to choose from
    else {
      projectPath = await selectProjectInteractively();
      if (!projectPath) {
        console.log(chalk.yellow('No project selected.'));
        return;
      }
    }

    // Open the project in an IDE
    await openInIDE(projectPath);
  } catch (error) {
    console.error(chalk.red(`Error opening express project: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Handle express move command
 */
async function handleExpressMove(argv) {
  try {
    // Check if we're running from within an express project
    const currentDir = process.cwd();
    const isExpressProject = currentDir.includes(EXPRESS_BASE_DIR);

    let projectPath;

    // If running from within an express project, use the current directory
    if (isExpressProject) {
      projectPath = currentDir;
      console.log(chalk.blue(`Using current express project: ${path.basename(projectPath)}`));
    }
    // If --latest flag is used, find the most recent project
    else if (argv.latest) {
      projectPath = await findLatestProject();
      if (!projectPath) {
        console.log(chalk.yellow('No express projects found.'));
        return;
      }
    }
    // If project name is provided, find that project
    else if (argv.projectName) {
      projectPath = await findProjectByName(argv.projectName);
      if (!projectPath) {
        console.log(chalk.yellow(`Project "${argv.projectName}" not found.`));
        return;
      }
    }
    // Otherwise, show a list of projects to choose from
    else {
      projectPath = await selectProjectInteractively();
      if (!projectPath) {
        console.log(chalk.yellow('No project selected.'));
        return;
      }
    }

    // Determine destination
    let destinationPath = argv.destination;

    if (!destinationPath) {
      // Ask for destination
      const answers = await fnetPrompt([
        {
          type: 'input',
          name: 'destination',
          message: 'Enter destination directory:',
          default: path.join(process.cwd(), path.basename(projectPath))
        }
      ]);

      destinationPath = answers.destination;
    }

    // Expand ~ to home directory if present
    if (destinationPath.startsWith('~')) {
      destinationPath = path.join(os.homedir(), destinationPath.slice(1));
    }

    // Resolve to absolute path
    destinationPath = path.resolve(destinationPath);

    // Check if destination exists
    if (fs.existsSync(destinationPath)) {
      const stats = fs.statSync(destinationPath);

      if (!stats.isDirectory()) {
        console.log(chalk.red(`Destination "${destinationPath}" is not a directory.`));
        return;
      }

      // Check if destination is empty
      const files = fs.readdirSync(destinationPath);
      if (files.length > 0) {
        const answers = await fnetPrompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Destination "${destinationPath}" is not empty. Continue anyway?`,
            default: false
          }
        ]);

        if (!answers.overwrite) {
          console.log(chalk.yellow('Project move cancelled.'));
          return;
        }
      }
    } else {
      // Create destination directory
      fs.mkdirSync(destinationPath, { recursive: true });
    }

    console.log(chalk.blue(`Moving project from ${projectPath} to ${destinationPath}...`));

    // Copy project files
    copyDirectory(projectPath, destinationPath);

    console.log(chalk.green(`\nProject moved successfully to ${destinationPath}`));

    // Ask if user wants to delete the original project
    const answers = await fnetPrompt([
      {
        type: 'confirm',
        name: 'deleteOriginal',
        message: 'Delete the original express project?',
        default: false
      }
    ]);

    if (answers.deleteOriginal) {
      fs.rmSync(projectPath, { recursive: true, force: true });
      console.log(chalk.green(`Original project deleted.`));
    }

    // Offer to open the project in an IDE
    await openInIDE(destinationPath);
  } catch (error) {
    console.error(chalk.red(`Error moving express project: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Find the latest express project
 */
async function findLatestProject() {
  // Get all date directories
  const dateDirs = fs.readdirSync(EXPRESS_BASE_DIR)
    .filter(name => /^\d{8}$/.test(name)) // Only include YYYYMMDD format directories
    .sort((a, b) => b.localeCompare(a)); // Sort in descending order (newest first)

  if (dateDirs.length === 0) {
    return null;
  }

  // Get projects from the newest date directory
  const newestDateDir = dateDirs[0];
  const datePath = path.join(EXPRESS_BASE_DIR, newestDateDir);
  const projectNames = fs.readdirSync(datePath);

  if (projectNames.length === 0) {
    return null;
  }

  // Find the newest project by creation time
  let newestProject = null;
  let newestTime = 0;

  for (const projectName of projectNames) {
    const projectPath = path.join(datePath, projectName);
    const stats = fs.statSync(projectPath);

    if (stats.birthtimeMs > newestTime) {
      newestTime = stats.birthtimeMs;
      newestProject = projectPath;
    }
  }

  return newestProject;
}

/**
 * Find a project by name
 */
async function findProjectByName(projectName) {
  // Get all date directories
  const dateDirs = fs.readdirSync(EXPRESS_BASE_DIR)
    .filter(name => /^\d{8}$/.test(name)) // Only include YYYYMMDD format directories
    .sort((a, b) => b.localeCompare(a)); // Sort in descending order (newest first)

  for (const dateDir of dateDirs) {
    const datePath = path.join(EXPRESS_BASE_DIR, dateDir);
    const projectNames = fs.readdirSync(datePath);

    // Check for exact match first
    if (projectNames.includes(projectName)) {
      return path.join(datePath, projectName);
    }

    // Check for partial matches
    const matches = projectNames.filter(name => name.includes(projectName));
    if (matches.length > 0) {
      if (matches.length === 1) {
        return path.join(datePath, matches[0]);
      } else {
        // If multiple matches, ask user to select
        const answers = await fnetPrompt([
          {
            type: 'list',
            name: 'selectedProject',
            message: `Multiple projects match "${projectName}". Please select one:`,
            choices: matches.map(name => ({
              name: `${name} (${dateDir})`,
              value: path.join(datePath, name)
            }))
          }
        ]);

        return answers.selectedProject;
      }
    }
  }

  return null;
}

/**
 * Select a project interactively
 */
async function selectProjectInteractively() {
  // Get all projects
  const projects = [];

  // Get all date directories
  const dateDirs = fs.readdirSync(EXPRESS_BASE_DIR)
    .filter(name => /^\d{8}$/.test(name)) // Only include YYYYMMDD format directories
    .sort((a, b) => b.localeCompare(a)); // Sort in descending order (newest first)

  for (const dateDir of dateDirs) {
    const datePath = path.join(EXPRESS_BASE_DIR, dateDir);
    const projectNames = fs.readdirSync(datePath);

    for (const projectName of projectNames) {
      const projectPath = path.join(datePath, projectName);
      const stats = fs.statSync(projectPath);

      // Format date as YYYY-MM-DD
      const formattedDate = `${dateDir.slice(0, 4)}-${dateDir.slice(4, 6)}-${dateDir.slice(6, 8)}`;

      projects.push({
        name: `${projectName} (${formattedDate})`,
        value: projectPath,
        created: stats.birthtime
      });
    }
  }

  // Sort projects by creation date (newest first)
  projects.sort((a, b) => b.created - a.created);

  if (projects.length === 0) {
    return null;
  }

  // Ask user to select a project
  const answers = await fnetPrompt([
    {
      type: 'list',
      name: 'selectedProject',
      message: 'Select a project:',
      choices: projects
    }
  ]);

  return answers.selectedProject;
}

/**
 * Offer to open a project in an IDE
 */
async function offerToOpenInIDE(projectPath) {
  try {
    const answers = await fnetPrompt([
      {
        type: 'confirm',
        name: 'openIDE',
        message: 'Would you like to open the project in an IDE?',
        default: true
      }
    ]);

    if (answers.openIDE) {
      await openInIDE(projectPath);
    }
  } catch (error) {
    console.error(chalk.red(`Error opening IDE: ${error.message}`));
  }
}

/**
 * Open a project in an IDE
 */
async function openInIDE(projectPath) {
  // Check for available IDEs
  const hasVSCode = await checkCommand('code --version');
  const hasVSCodeInsiders = await checkCommand('code-insiders --version');

  let ideCommand = null;

  if (hasVSCode && hasVSCodeInsiders) {
    // Ask which IDE to use
    const answers = await fnetPrompt([
      {
        type: 'list',
        name: 'ide',
        message: 'Which IDE would you like to use?',
        choices: [
          { name: 'Visual Studio Code', value: 'code' },
          { name: 'Visual Studio Code Insiders', value: 'code-insiders' }
        ]
      }
    ]);

    ideCommand = answers.ide;
  } else if (hasVSCode) {
    ideCommand = 'code';
  } else if (hasVSCodeInsiders) {
    ideCommand = 'code-insiders';
  } else {
    console.log(chalk.yellow('No supported IDE found. Please open the project manually.'));
    console.log(chalk.blue(`Project path: ${projectPath}`));
    return;
  }

  // Open the project in the selected IDE
  const ideProcess = spawn(ideCommand, [projectPath], {
    stdio: 'inherit',
    shell: true
  });

  return new Promise((resolve, reject) => {
    ideProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`Project opened in ${ideCommand}.`));
        resolve();
      } else {
        console.error(chalk.red(`Failed to open project in ${ideCommand}.`));
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

/**
 * Check if a command is available
 */
async function checkCommand(command) {
  return new Promise((resolve) => {
    const process = spawn(command, { shell: true, stdio: 'ignore' });
    process.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * Copy a directory recursively
 */
function copyDirectory(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Get all files and directories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Skip .git directory
      if (entry.name === '.git') {
        continue;
      }

      // Recursively copy subdirectory
      copyDirectory(sourcePath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}
