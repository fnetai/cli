import { promisify } from 'node:util';
import treeKill from 'tree-kill';

const treeKillAsync = promisify(treeKill);

let isExiting = false;

export async function terminateSubprocess(subprocess, signal) {
  if (isExiting) return;
  isExiting = true;
  
  // console.log(`Terminating subprocess (signal: ${signal || 'none'})...`);
  
  if (!subprocess.killed && subprocess.pid) {
    try {
      await treeKillAsync(subprocess.pid, 'SIGTERM').catch(() => {
        // Ignore errors from SIGTERM - we'll try SIGKILL next if needed
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!subprocess.killed) {
        // console.log('Process still running, forcing termination...');
        await treeKillAsync(subprocess.pid, 'SIGKILL').catch(() => {
          // Ignore errors - process might already be gone
        });
      }
    } catch (err) {
      // console.error(`Failed to terminate subprocess: ${err.message}`);
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const exitCode = signal === 'SIGINT' ? 130 : (signal === 'SIGTERM' ? 143 : 1);
  process.exit(exitCode);
}

export function setupSignalHandlers(subprocess) {
  ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.once(signal, async () => {
      await terminateSubprocess(subprocess, signal);
    });
  });

  process.on('uncaughtException', async (err) => {
    // console.error('Uncaught exception:', err);
    await terminateSubprocess(subprocess);
  });
  
  process.on('unhandledRejection', async (reason) => {
    // console.error('Unhandled promise rejection:', reason);
    await terminateSubprocess(subprocess);
  });

  subprocess.on('close', (code) => {
    if (!isExiting) {
      process.exit(code);
    }
  });
}

export function setupGlobalErrorHandlers() {
  process.on('uncaughtException', (err) => {
    // console.error('Uncaught exception at global level:', err);
    if (!isExiting) {
      isExiting = true;
      // console.log('Terminating due to uncaught exception...');
      setTimeout(() => process.exit(1), 500);
    }
  });

  process.on('unhandledRejection', (reason) => {
    // console.error('Unhandled promise rejection at global level:', reason);
    if (!isExiting) {
      isExiting = true;
      // console.log('Terminating due to unhandled promise rejection...');
      setTimeout(() => process.exit(1), 500);
    }
  });
}

export function isProcessExiting() {
  return isExiting;
}

export function setProcessExiting(value) {
  isExiting = value;
}
