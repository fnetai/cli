import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';

export default (binName) => {
  const pathEnv = process.env.PATH || '';
  const pathExt = process.platform === 'win32'
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';')
    : [''];

  const paths = pathEnv.split(delimiter);

  for (const dir of paths) {
    for (const ext of pathExt) {
      const fullPath = join(dir, process.platform === 'win32' ? binName + ext : binName);
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  return null;
};
