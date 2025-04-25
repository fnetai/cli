import fs from 'node:fs';
import path from 'node:path';

import nunjucks from "nunjucks";
import fnetParseImports from '@flownet/lib-parse-imports-js';
import fnetParseNodeUrl from '@flownet/lib-parse-node-url';

import BuilderBase from './lib-builder-base.js';
import initFeatures from "./api/init-features/index.js";
import initDependencies from "./api/init-dependencies/index.js";
import createApp from "./api/create-app/index.js";
import createPackageJson from "./api/create-package-json/index.js";
import createCli from "./api/create-cli/index.js";
import createRollup from "./api/create-rollup/index.js";
import createToYargs from "./api/create-to-yargs/index.js";
import createGitIgnore from "./api/create-git-ignore/index.js";
import createTsConfig from "./api/create-ts-config/index.js";
import createProjectReadme from "./api/create-project-readme/index.js";
import formatFiles from './api/format-files/index.js';
import createDts from './api/create-dts/index.js';
import installNpmPackages from './api/install-npm-packages/index.js';
import runNpmBuild from './api/run-npm-build/index.js';
import pickNpmVersions from './api/common/pick-npm-versions.js';

/**
 * Node.js-specific builder class
 * Extends the base builder with Node.js-specific functionality
 */
class NodeBuilder extends BuilderBase {
  /**
   * Initialize the Node.js runtime
   * @returns {Promise<void>}
   */
  async initRuntime() {
    await initFeatures(this.apiContext);
    await initDependencies(this.apiContext);
    await this.initLibraryDir();
    await this.initNunjucks();
    await this.initLibs();
  }

  /**
   * Initialize external libraries
   * @returns {Promise<void>}
   */
  async initLibs() {
    this.setProgress({ message: "Initializing external libs." });

    const libs = [{
      name: this.atom.doc.name,
      type: "atom",
      parent_id: this.atom.parent_id
    }];

    this.libs = libs;

    await this.initAtomLibsAndDeps({ libs, packageDependencies: this.apiContext.packageDependencies });
  }

  /**
   * Initialize atom libraries and dependencies
   * @param {Object} params - Parameters
   * @param {Array} params.libs - Libraries
   * @param {Array} params.packageDependencies - Package dependencies
   * @returns {Promise<void>}
   */
  async initAtomLibsAndDeps({ libs, packageDependencies }) {
    const atomLibRefs = libs.filter(w => w.type === 'atom');
    for (let i = 0; i < atomLibRefs.length; i++) {
      const atomLibRef = atomLibRefs[i];

      const atomLib = await this.findAtomLibrary({ url: atomLibRef.name });
      atomLibRef.atom = atomLib;

      const packageDeps = atomLib.doc.dependencies?.filter(w => typeof w.repo === 'undefined' || w.repo === 'npm');
      packageDeps?.forEach(npmDep => {
        const found = packageDependencies.find(w => w.package === npmDep.package);
        if (found) {
          if (typeof npmDep.path === 'string') {
            if (!(found.path || []).some(w => w === npmDep.path)) {
              found.path = found.path || [];
              found.path.push(npmDep.path);
            }
          }
          else if (Array.isArray(npmDep.path)) {
            npmDep.path.forEach(item => {
              if (!(found.path || []).some(w => w === item)) {
                found.path = found.path || [];
                found.path.push(item);
              }
            });
          }
        }
        else packageDependencies.push(npmDep);
      });
    }
    packageDependencies.sort((a, b) => a.package?.localeCompare(b.package));
  }

  /**
   * Find an atom library
   * @param {Object} params - Parameters
   * @param {string} params.url - Library URL
   * @returns {Promise<Object>} Atom library
   */
  async findAtomLibrary({ url }) {
    const parsedUrl = fnetParseNodeUrl({ url: url });
    if (!parsedUrl) throw new Error(`Invalid package name: ${url}`);

    if (!parsedUrl.protocol) parsedUrl.protocol = this.context.protocol;

    if (parsedUrl.protocol === 'ac:') {
      const parts = parsedUrl.pathname.split('/');
      if (parts.length === 1) {
        return await this.apiContext.Atom.first({ where: { name: url, parent_id: this.atomConfig.env.ATOM_LIBRARIES_ID, type: "workflow.lib" } });
      }

      if (parts.length === 2) {
        const folder = await this.apiContext.Atom.first({ where: { name: parts[0], parent_id: this.atomConfig.env.ATOM_LIBRARIES_ID, type: "folder" } });
        return await this.apiContext.Atom.first({ where: { name: parts[1], parent_id: folder.id, type: "workflow.lib" } });
      }
    }
    else if (parsedUrl.protocol === 'local:') {
      const atom = this.atom;
      atom.protocol = "local:";
      atom.doc.dependencies = atom.doc.dependencies || [];
      atom.name = atom.doc.name;

      const srcFilePath = path.resolve(this.context.projectSrcDir, `${'index'}.js`);
      const parsedImports = await fnetParseImports({ file: srcFilePath, recursive: true });
      const dependencies = atom.doc.dependencies;
      const targetImports = parsedImports.all;

      for await (const parsedImport of targetImports) {
        if (parsedImport.type !== 'npm') continue;

        if (dependencies.find(w => w.package === parsedImport.package)) continue;

        const npmVersions = await pickNpmVersions({
          name: parsedImport.package,
          projectDir: this.context.projectDir,
          setProgress: this.apiContext.setProgress
        });

        dependencies.push({
          package: parsedImport.package,
          subpath: parsedImport.subpath,
          version: npmVersions.minorRange,
          type: "npm"
        })
      }

      return atom;
    }
  }

  /**
   * Create atom library files
   * @param {Object} params - Parameters
   * @param {Array} params.libs - Libraries
   * @returns {Promise<void>}
   */
  async createAtomLibFiles({ libs }) {
    await this.setProgress({ message: "Creating external lib files." });

    this.atom.typesDir = './types';

    const atomLibRefs = libs.filter(w => w.type === 'atom');
    for (let i = 0; i < atomLibRefs.length; i++) {
      const atomLibRef = atomLibRefs[i];

      const atomLib = atomLibRef.atom;
      const projectDir = this.context.projectDir;
      if (atomLib.protocol === 'local:') {
        const srcFilePath = path.resolve(this.context.projectSrcDir, `${atomLib.fileName || atomLib.name}.js`);
        const relativePath = path.relative(path.join(this.context.projectDir, 'src', 'default'), srcFilePath);

        if (!fs.existsSync(srcFilePath)) {
          fs.mkdirSync(path.dirname(srcFilePath), { recursive: true });
          let template = 'export default async (args)=>{\n';
          template += '}';
          fs.writeFileSync(srcFilePath, template, 'utf8');
        }

        atomLib.relativePath = relativePath.split(path.sep).join('/');

        this.atom.typesDir = `./types/${path.basename(projectDir)}/src`;
      }
      else {
        const atomLibPath = path.join(projectDir, 'src', 'libs', `${atomLib.id}.js`);
        const content = atomLib.doc.contents?.find(w => w.format === 'esm') || atomLib.doc;
        fs.writeFileSync(atomLibPath, content.content, 'utf8');
      }
    }
  }

  /**
   * Create the engine file
   * @returns {Promise<void>}
   */
  async createEngine() {
    await this.setProgress({ message: "Creating engine file." });

    const libs = this.libs.filter(w => w.type === 'atom');

    const templateContext = { libs, libraryAtom: this.atom, atom: this.atom }

    const templateDir = this.context.templateDir;
    const template = nunjucks.compile(
      fs.readFileSync(path.resolve(templateDir, path.join('src', 'default', 'engine.js.njk')), "utf8"),
      this.apiContext.njEnv
    );

    const templateRender = template.render(templateContext);

    const projectDir = this.context.projectDir;
    const filePath = path.resolve(projectDir, path.join('src', 'default', 'index.js'));
    fs.writeFileSync(filePath, templateRender, 'utf8');
  }

  /**
   * Build the Node.js project
   * @returns {Promise<void>}
   */
  async build() {
    try {
      if (this.fileMode) {
        await this.createAtomLibFiles({ libs: this.libs });
        await this.createEngine();
        await this.createProjectYaml();

        await createProjectReadme(this.apiContext);
        await createTsConfig(this.apiContext);
        await createGitIgnore(this.apiContext);
        await createToYargs(this.apiContext);
        await createCli(this.apiContext);
        await createApp(this.apiContext);
        await createRollup(this.apiContext);
        await createPackageJson(this.apiContext);

        await formatFiles(this.apiContext);

        await createDts(this.apiContext);

        if (this.buildMode) {
          await installNpmPackages(this.apiContext);
          await runNpmBuild(this.apiContext);

          if (this.deployMode)
            await this.deploy();
        }
      }

      await this._cache_set(this.buildKey, { status: "COMPLETED" });
    }
    catch (error) {
      await this._cache_set(this.buildKey, { status: "FAILED", message: error.message || error });
      console.log(error);
      throw error;
    }
  }
}

export default NodeBuilder;
