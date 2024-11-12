const fnetPickNpmVersions = require('@fnet/npm-pick-versions');

const hash = require('object-hash');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async ({ projectDir, name, setProgress, count = 1 }) => {

  let npmVersions;

  const key = ['npm-pick-versions', name, count];
  const cacheKey = hash(key);
  const cacheDir = path.join(projectDir, '.cache');
  const cacheFile = path.join(cacheDir, cacheKey + '.json');

  if (fs.existsSync(cacheFile)) {
    if (setProgress) setProgress(`Picking npm version of ${name} from cache ...`);
    npmVersions = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }
  else {
    if (setProgress) setProgress(`Picking npm version of ${name} ...`);
    npmVersions = await fnetPickNpmVersions({ name: name, count });
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(npmVersions), 'utf8');
  }

  return npmVersions;
}