import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { runCommandGroup } from '../utils/common-run.js';

// Main function
async function main() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 <command> [options]')
    .command('$0 <group> [options..]', 'Run a command group from project file', (yargs) => {
      return yargs
        .positional('group', {
          type: 'string',
          describe: 'Command group to run'
        })
        .option('ftag', {
          type: 'array',
          describe: 'Tags for conditional configuration'
        })
        .example('$0 build', 'Run the build command group')
        .example('$0 test --ftag dev', 'Run the test command group with dev tag')
    })
    .help()
    .version()
    .argv;

  // Run command group using the common utility
  await runCommandGroup({
    projectType: 'auto', // Auto-detect project type
    group: argv.group,
    tags: argv.ftag,
    args: argv,
    argv: process.argv
  });
}

// Run main function
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
