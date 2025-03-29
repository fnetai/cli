import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findNodeModules({ baseDir = __dirname }) {
    let currentDir = baseDir;

    while (currentDir !== path.parse(currentDir).root) {
        const potentialPath = path.join(currentDir, 'node_modules');

        if (fs.existsSync(potentialPath)) {
            return potentialPath;
        }

        currentDir = path.dirname(currentDir);
    }

    return null;
}

export default findNodeModules;