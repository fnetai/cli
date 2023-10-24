const fs = require('node:fs');
const path = require('node:path');

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

module.exports = findNodeModules;