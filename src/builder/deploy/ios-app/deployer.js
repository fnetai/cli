import fs from "node:fs";
import fnetShellJs from "@fnet/shelljs";
import fnetCreateIosIcons from "@flownet/lib-create-ios-icons";
import fnetCreateIosLaunchScreens from "@flownet/lib-create-ios-launch-screens";
import fnetRenderTemplatesDir from "@flownet/lib-render-templates-dir";
import path from "node:path";
import xcodeCertInspector from "@fnet/xcode-cert-inspector";
import resolveTemplatePath from '../../../utils/resolve-template-path.js';

export default async ({
  atom,
  params,
  config,
  src,
  dest,
}) => {

  const certificates = await xcodeCertInspector();
  const defaultCertificate = certificates.find(c => c.certificateType === 'Development' && c.platforms.includes('iOS'));
  const defaultTeamId = defaultCertificate?.teamID;

  params.name = params.name || "ios-app";
  params.entry = params.entry || "app/ios";
  params.id = params.id || "com.example.ios-app";
  params.version = params.version || "0.1.0";

  params.title = params.title || atom?.doc?.title || params.name || atom?.doc?.name || "iOS App";
  params.package_name = params.package_name || params.name;
  params.author = params.author || atom?.doc?.author || "Flownet";
  params.description = params.description || atom?.doc?.description || "iOS App built with Flownet";

  params.vendor = params.vendor || "flownet.ai";
  params.include_css = atom?.doc?.features?.css_options?.extract === true;
  params.bundle_name = atom?.doc?.bundleName;

  params.package_dir = params.package_dir || `./.package/${params.name}`;
  params.package_dir = path.resolve(dest, params.package_dir);

  params.code_sign_identity = params.code_sign_identity || "Apple Development";
  params.code_sign_style = params.code_sign_style || "Automatic";
  params.development_team = params.development_team || defaultTeamId;
  params.provisioning_profile_specifier = params.provisioning_profile_specifier || "";

  params.product_bundle_identifier = params.product_bundle_identifier || params.id;
  params.product_name = params.product_name || params.name;

  // remove package dir if exists
  if (fs.existsSync(params.package_dir)) fs.rmSync(params.package_dir, { recursive: true });

  params.out_dir = params.out_dir || `./.out/${params.name}`;
  params.out_dir = path.resolve(dest, params.out_dir);

  // remove out dir if exists
  if (fs.existsSync(params.out_dir)) fs.rmSync(params.out_dir, { recursive: true });

  // template dir
  const templateDir = resolveTemplatePath('./template/deploy/to-ios-app');
  if (!fs.existsSync(templateDir)) throw new Error(`${templateDir} doesn't exist`);

  // source dir check
  if (!src || !fs.existsSync(src)) throw new Error(`${src} doesn't exists`);

  // source dist dir check
  const srcDistDir = path.resolve(src, `./dist`);
  if (!fs.existsSync(srcDistDir)) throw new Error(`${srcDistDir} doesn't exists`);

  // dest dir check
  if (!dest || !fs.existsSync(dest)) throw new Error(`${dest} doesn't exists`);

  // create out directory
  const outDir = path.resolve(dest, params.out_dir);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // create package directory
  const packageDir = path.resolve(src, params.package_dir);
  if (!fs.existsSync(packageDir)) fs.mkdirSync(packageDir, { recursive: true });

  await fnetRenderTemplatesDir({
    dir: templateDir,
    outDir: outDir,
    context: { atom, params, config },
    copyUnmatchedAlso: true
  });

  const destSrcDir = path.resolve(outDir, './fnet');
  if (!fs.existsSync(destSrcDir)) fs.mkdirSync(destSrcDir, { recursive: true });

  let shResult = await fnetShellJs(`cp -a ${srcDistDir} ${destSrcDir}`);
  if (shResult.code !== 0) throw new Error('Couldnt copy project dist files.');

  const iconDir = path.resolve(outDir, './fnet-ios-app/Assets.xcassets/AppIcon.appiconset');
  await fnetCreateIosIcons({ text: params.id, dir: iconDir, platform: 'ios' });

  const launchScreensDir = path.resolve(outDir, './fnet-ios-app/Assets.xcassets/launch-images.imageset');
  await fnetCreateIosLaunchScreens({
    text: params.id, dir: launchScreensDir, sizes: [
      { width: 1242, height: 2688 }, { width: 1536, height: 2048 }, { width: 2048, height: 1536 }
    ]
  });

  const configutaions = [{ build: 'Debug', sdk: "iphonesimulator" }, { build: 'Release', sdk: "iphoneos" }];

  for (const config of configutaions) {
    let buildCommand = 'xcodebuild';
    buildCommand += ' -project fnet-ios-app.xcodeproj';
    buildCommand += ' -scheme fnet-ios-app';
    buildCommand += ` -configuration ${config.build}`;
    buildCommand += ` -sdk ${config.sdk}`;
    buildCommand += ` -allowProvisioningUpdates`;
    buildCommand += ' build';
    buildCommand += ' DSTROOT=./dist';
    buildCommand += ' SYMROOT=./dist';

    shResult = await fnetShellJs(`${buildCommand}`, { cwd: outDir });
    if (shResult.code !== 0) throw new Error(`Couldn\'t build project: ${shResult.stderr}`);
  }
}
