import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import fnetListFiles from '@fnet/list-files';
import BuilderBase from './lib-builder-base.js';
import initFeaturesPython from "./api/init-features/python.js";
import initDependenciesPython from "./api/init-dependencies/python.js";
import createCliPython from "./api/create-cli/python.js";
import createGitIgnore from "./api/create-git-ignore/index.js";
import createProjectReadme from "./api/create-project-readme/index.js";
import installPythonPackages from './api/install-python-packages/index.js';

/**
 * Python-specific builder class
 * Extends the base builder with Python-specific functionality
 */
class PythonBuilder extends BuilderBase {
  /**
   * Initialize the Python runtime
   * @returns {Promise<void>}
   */
  async initRuntime() {
    await initFeaturesPython(this.apiContext);
    await initDependenciesPython(this.apiContext);
    await this.initLibraryDirPython();
    await this.initNunjucks();
    await this.initLibsPython();
  }

  /**
   * Initialize the Python library directory
   * @returns {Promise<void>}
   */
  async initLibraryDirPython() {
    this.setProgress({ message: "Initializing library directory." });

    const projectDir = this.context.projectDir;

    this.setProgress({ message: "Cleaning project directory." });

    const assets = fnetListFiles({ dir: projectDir, ignore: ['.cache', 'node_modules', '.conda', '.bin'], absolute: true });
    for (const asset of assets) {
      fs.rmSync(asset, { recursive: true, force: true });
    }

    this.setProgress({ message: "Creating project directory." });

    let target = projectDir;
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    target = path.join(projectDir, 'src');
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    target = path.join(projectDir, 'src', 'default');
    const source = this.context.projectSrcDir;

    if (!fs.existsSync(target)) {
      try {
        if (os.platform() === 'win32') {
          // Windows requires special handling
          fs.symlinkSync(source, target, 'junction');
        } else {
          // For Unix-like systems
          fs.symlinkSync(source, target, 'dir');
        }
      } catch (err) {
        throw new Error(`Couldn't create symlink. Error: ${err.message}`);
      }
    }
  }

  /**
   * Initialize Python libraries
   * @returns {Promise<void>}
   */
  async initLibsPython() {
    this.setProgress({ message: "Initializing external libs." });

    const atom = this.atom;
    atom.protocol = "src:";
    atom.doc.dependencies = atom.doc.dependencies || [];
    atom.name = atom.doc.name;

    const libs = [{
      name: this.atom.doc.name,
      type: "atom",
      parent_id: this.atom.parent_id,
      atom
    }];

    this.libs = libs;
  }

  /**
   * Create Python atom library files
   * @param {Object} params - Parameters
   * @param {Array} params.libs - Libraries
   * @returns {Promise<void>}
   */
  async createAtomLibFilesPython({ libs }) {
    await this.setProgress({ message: "Creating external lib files." });

    const atomLibRefs = libs.filter(w => w.type === 'atom');
    for (let i = 0; i < atomLibRefs.length; i++) {
      const atomLibRef = atomLibRefs[i];

      const atomLib = atomLibRef.atom;
      if (atomLib.protocol === 'src:') {
        const srcFilePath = path.resolve(this.context.projectSrcDir, `${atomLib.fileName || atomLib.name}.py`);
        if (!fs.existsSync(srcFilePath)) {
          fs.mkdirSync(path.dirname(srcFilePath), { recursive: true });
          let template = 'def default():\n';
          template += '  print("Hello world!")\n';
          fs.writeFileSync(srcFilePath, template, 'utf8');
        }
      }
    }
  }

  /**
   * Build the Python project
   * @returns {Promise<void>}
   */
  async build() {
    try {
      if (this.fileMode) {
        await this.createAtomLibFilesPython({ libs: this.libs });
        await this.createProjectYaml();

        await createProjectReadme(this.apiContext);
        await createGitIgnore(this.apiContext);
        await createCliPython(this.apiContext);

        if (this.buildMode) {
          await installPythonPackages(this.apiContext);

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

export default PythonBuilder;
