const fs = require('node:fs');
const path = require('node:path');
const semver = require('semver');

const fnetShell = require('@fnet/shell');
const fnetConfig = require('@fnet/config');

module.exports = async ({ setInProgress, context, deploymentProject, deploymentProjectTarget: target, registerToPackageManager }) => {

  await setInProgress({ message: "Deploying it as gcs package." });

  const projectDir = context.projectDir;
  const packageJSONPath = path.resolve(projectDir, 'package.json');

  const packageJSONContent = fs.readFileSync(packageJSONPath);

  const packageJSON = JSON.parse(packageJSONContent);

  packageJSON.name = target.params.name;
  packageJSON.version = semver.inc(target.params.version, "patch");

  delete packageJSON.scripts;
  delete packageJSON.devDependencies;

  fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, "\t"));

  const { file: pmFile, data: gcsConfig } = await fnetConfig({
    name: target.config || "gcs",
    dir: context.projectDir,
    tags: context.tags
  });
  
  let command = `fnet-files-to-gcs`;
  command += ` --projectId='${gcsConfig.env.GCS_PROJECT_ID}'`;
  command += ` --bucketName='${gcsConfig.env.GCS_BUCKET_NAME}'`;
  command += ` --keyFilename='${path.resolve(path.dirname(pmFile), gcsConfig.env.GCS_UPLOADER_KEY_FILE)}'`;
  command += ` --dir='${projectDir}'`;
  command += ` --pattern={'dist/**/**','bin/**/**','test/**/**','*.html'}`;
  command += ` --destDir='${packageJSON.name}/${packageJSON.version}'`;
  command += ` --metadata.cacheControl='public, max-age=31536000, immutable'`;
  // command += ` --verbose`;

  if (gcsConfig.env.DOMAIN) command += ` --domain='${gcsConfig.env.DOMAIN}'`;

  if (target.dry_run === true || target.params.dry_run === true) command += ` --dryRun`;

  await fnetShell({ cmd: command });

  // restore
  fs.writeFileSync(packageJSONPath, packageJSONContent);

  if (target.dryRun === true) return;

  deploymentProject.isDirty = true;
  target.params.version = packageJSON.version;

  await registerToPackageManager({ target, packageJSON });
}