/**
 * With command for fnode CLI
 */
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import fnetConfig from '@fnet/config';
import { setupSignalHandlers } from '../utils/process-manager.js';
import { createContext } from './context.js';

/**
 * Command configuration
 */
const command = {
  command: 'with <config> <command> [options..]',
  describe: 'Run a command with a config context',
  builder: (yargs) => {
    return yargs
      .positional('config', {
        type: 'string',
        describe: 'Config name'
      })
      .positional('command', {
        type: 'string',
        describe: 'Command to run'
      });
  },
  handler: async (argv) => {
    try {
      const context = await createContext(argv);
      const { projectDir } = context;
      const cwd = process.cwd();

      // config name
      const configName = argv.config;
      const config = await fnetConfig({
        name: configName,
        dir: projectDir,
        transferEnv: false,
        optional: true,
        tags: context.tags
      });
      const env = config?.data?.env || undefined;

      // command name
      const commandName = argv.command;

      const rawArgs = process.argv.slice(5);

      const subprocess = spawn(commandName, [...rawArgs], {
        cwd: fs.existsSync(projectDir) ? projectDir : cwd,
        stdio: 'inherit',
        shell: true,
        detached: true,
        env: {
          ...process.env,
          ...env
        }
      });

      // Set up signal handlers and error handlers for the subprocess
      setupSignalHandlers(subprocess);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }
};

export default command;
