import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import fnetShellJs from '@fnet/shelljs';
import fnetConfig from '@fnet/config';

export default async function deployToGcs({ setProgress, context, deploymentProject, deploymentProjectTarget: target, registerToPackageManager, yamlTarget }) {

  await setProgress({ message: "Deploying it as gcs package." });

  const projectDir = context.projectDir;
  const packageJSONPath = path.resolve(projectDir, 'package.json');

  const packageJSONContent = fs.readFileSync(packageJSONPath);

  const packageJSON = JSON.parse(packageJSONContent);

  packageJSON.name = target.params.name;
  packageJSON.version = semver.inc(target.version, "patch");

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
  command += ` --pattern='dist/**/**'`;
  command += ` --pattern='bin/**/**'`;
  command += ` --pattern='test/**/**'`;
  command += ` --pattern='*.html'`;
  command += ` --destDir='${packageJSON.name}/${packageJSON.version}'`;
  command += ` --metadata.cacheControl='public, max-age=31536000, immutable'`;
  // command += ` --verbose`;

  console.log(command);

  if (gcsConfig.env.DOMAIN) command += ` --domain='${gcsConfig.env.DOMAIN}'`;

  if (target.dry_run === true || target.params.dry_run === true) command += ` --dryRun`;

  await fnetShellJs(command);

  // restore
  fs.writeFileSync(packageJSONPath, packageJSONContent);

  if (target.dryRun === true) return;

  deploymentProject.isDirty = true;
  target.version = packageJSON.version;
  yamlTarget.set('version', packageJSON.version);

  await registerToPackageManager({ target, packageJSON });
}