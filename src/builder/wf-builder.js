"use strict";

const fs = require('node:fs');
const path = require('node:path');

const yaml = require("yaml");
const shell = require('shelljs');
const nunjucks = require("nunjucks");
const cloneDeep = require('lodash.clonedeep');
const isObject = require('isobject');
const createRedisClient = require('../redisClient');
const { nanoid } = require('nanoid');

const Auth = require('./auth');

const initFeatures = require("./api/init-features");
const initDependencies = require("./api/init-dependencies");
const createApp = require("./api/create-app");
const createPackageJson = require("./api/create-package-json");
const createCli = require("./api/create-cli");
const createRollup = require("./api/create-rollup");
const createToYargs = require("./api/create-to-yargs");
const createGitIgnore = require("./api/create-git-ignore");
const createTsConfig = require("./api/create-ts-config");
const createProjectReadme = require("./api/create-project-readme");
const formatFiles = require('./api/format-files');
const createDts = require('./api/create-dts');
const installNpmPackages = require('./api/install-npm-packages');
const runNpmBuild = require('./api/run-npm-build');
const pickNpmVersions = require('./api/common/pick-npm-versions');

const deployTo = require('./deploy/deploy-to');

const { Atom } = require("@flownet/lib-atom-api-js");
const fnetParseNodeUrl = require('@flownet/lib-parse-node-url');
const fnetBpmnFromFlow = require('./bpmn');
const fnetConfig = require('@fnet/config');
const fnetParseImports = require('@flownet/lib-parse-imports-js');
const fnetExpression = require('@fnet/expression');

const fnetYaml = require('@fnet/yaml');

const chalk = require('chalk');

const fnetListFiles = require('@fnet/list-files');

// BLOCKS
const ifBlock = require('./block/if');
const tryExceptBlock = require('./block/try-except');
const assignBlock = require('./block/assign');
const forBlock = require('./block/for');
const switchBlock = require('./block/switch');
const parralelBlock = require('./block/parallel');
const raiseBlock = require('./block/raise');
const returnBlock = require('./block/return');
const callBlock = require('./block/call');
const stepsBlock = require('./block/steps');
const formBlock = require('./block/form');
const operationBlock = require('./block/operation');
const jumpBlock = require('./block/jump');
const modulesBlock = require('./block/modules');
const resolveNextBlock = require('./block-api/resolve-next-block');
const npmBlock = require('./block/npm-block');

class Builder {

  #auth;
  #context;
  #atom;
  #workflow;
  #njEnv;
  #packageDependencies;
  #packageDevDependencies;
  #stepTemplateCache;
  #atomAccessToken;
  #root;
  #buildId;
  #buildKey;
  #protocol;
  #atomConfig;

  #mode;
  #fileMode;
  #buildMode;
  #deployMode;
  #bpmnMode;
  #apiContext;
  #blockBuilderContext;
  #npmBlocks = []

  constructor(context) {

    this.#auth = new Auth();
    this.#context = context;
    this.#packageDependencies = [];
    this.#packageDevDependencies = [];
    this.#stepTemplateCache = {};

    this._expire_ttl = 3600; // 1-hour
    this._expire_ttl_short = 300; // 5-minutes

    this.#npmBlocks.push(npmBlock({ key: 'config', npm: '@fnet/config', master: "name" }));
    this.#npmBlocks.push(npmBlock({ key: 'yaml', npm: '@fnet/yaml', master: "file" }));
    this.#npmBlocks.push(npmBlock({ key: 'prompt', npm: '@fnet/prompt', master: "message" }));
    this.#npmBlocks.push(npmBlock({ key: 'html-link', npm: '@flownet/lib-load-browser-link-url', master: "src" }));
    this.#npmBlocks.push(npmBlock({ key: 'html-script', npm: '@flownet/lib-load-browser-script-url', master: "src" }));
    this.#npmBlocks.push(npmBlock({ key: 'http-server', npm: '@fnet/node-express', master: "server_port" }));
    this.#npmBlocks.push(npmBlock({ key: 'shell', npm: '@fnet/shell', master: "cmd" }));
    this.#npmBlocks.push(npmBlock({ key: 'shell-flow', npm: '@fnet/shell-flow', master: "commands" }));
    this.#npmBlocks.push(npmBlock({ key: 'list-files', npm: '@fnet/list-files', master: "pattern" }));
    this.#npmBlocks.push(npmBlock({ key: 'up-list-files', npm: '@fnet/up-list-files', master: "pattern" }));
    this.#npmBlocks.push(npmBlock({ key: 'auto-conda-env', npm: '@fnet/auto-conda-env', master: "envDir" }));
    this.#npmBlocks.push(npmBlock({ key: 'ollama-chat', npm: '@fnet/ollama-chat', master: "model" }));
    this.#npmBlocks.push(npmBlock({ key: 'ai', npm: '@fnet/ai', master: "prompt", extras: { subtype: "flow" } }));
    this.#npmBlocks.push(npmBlock({ key: 'invoke', npm: '@fnet/invoke', master: "method", extras: {} }));
    this.#npmBlocks.push(npmBlock({ key: 'fetch', npm: '@fnet/fetch', master: "url", extras: {} }));
    this.#npmBlocks.push(npmBlock({ key: 'filemap', npm: '@fnet/filemap', target: "url", extras: {} }));

    this.#apiContext = {
      packageDependencies: this.#packageDependencies,
      packageDevDependencies: this.#packageDevDependencies,
      setProgress: this.setProgress.bind(this),
      context: this.#context,
      Atom,
      registerToPackageManager: this.registerToPackageManager.bind(this)
    }

    this.#blockBuilderContext = {
      initNode: this.initNode.bind(this),
      cloneDeep: cloneDeep,
      resolveTypeCommon: this.resolveTypeCommon.bind(this),
      resolveNextBlock: resolveNextBlock,
      transformExpression: this.transformExpression.bind(this),
      transformValue: this.transformValue.bind(this),
    }
  }

  async _cache_set(key, value, expire_ttl) {
    if (!this._redis_client) return;

    await this._redis_client.SETEX(
      key,
      expire_ttl || this._expire_ttl,
      JSON.stringify(value),
    ).catch(console.error);
  }

  async init() {

    this._redis_client = await createRedisClient();

    this.#buildId = this.#context.buildId || nanoid(24);
    this.#apiContext.buildId = this.#buildId;

    this.#mode = this.#context.mode;
    this.#fileMode = ['all', 'deploy', 'build', 'file'].includes(this.#mode);
    this.#buildMode = ['all', 'deploy', 'build'].includes(this.#mode);
    this.#deployMode = ['all', 'deploy'].includes(this.#mode);
    this.#bpmnMode = ['all', 'deploy', 'build', 'file', 'bpmn'].includes(this.#mode);

    this.#protocol = this.#context.protocol;
    this.#buildKey = "BUILD:" + this.#buildId;

    this.#atomConfig = (await fnetConfig({ optional: true, name: "atom", dir: this.#context.projectDir, tags: this.#context.tags }))?.data;

    try {
      await this.setProgress({ message: "Initialization started." });

      await this.initAuth();
      await this.initWorkflow();

      // await initFeatures(this.#apiContext);
      // await initDependencies(this.#apiContext);

      this.transformWorkflow({ workflow: this.#workflow });

      const root = await this.initNodeTree({ workflow: this.#workflow });
      await this.initNodeTreeIndex({ root });

      await this.initNodeCalls({ root });
      await this.initNodeCallLibs({ root });

      await this.initNodeForms({ root });
      await this.initNodeFormLibs({ root });

      await this.initEntryFiles({ root, features: this.#atom.doc.features });
      await this.initFeaturesFromNodes({ childs: root.childs, features: this.#atom.doc.features });

      await initFeatures(this.#apiContext);
      await initDependencies(this.#apiContext);

      await this.initAtomLibsAndDeps({ libs: root.context.libs, packageDependencies: this.#packageDependencies });

      await this.resolveNodeTree({ root });

      this.#root = root;
    }
    catch (error) {
      await this._cache_set(this.#buildKey, { status: "FAILED", message: error?.message || error });
      throw error;
    }
  }

  async initAuth() {
    if (!this.#context.id) return;
    this.#atomAccessToken = await this.#auth.init({ config: this.#atomConfig });
    this.#apiContext.atomAccessToken = this.#atomAccessToken;
  }

  async initWorkflow() {
    const workflowId = this.#context.id;
    this.#atom = this.#context.project?.workflowAtom || await Atom.get({ id: workflowId });
    this.#workflow = typeof this.#atom.doc.content === 'string' ? (await fnetYaml({ content: this.#atom.doc.content, tags: this.#context.tags })).parsed : this.#atom.doc.content;
    let bundleName = this.#atom.doc.bundleName;
    bundleName = bundleName || (this.#atom.doc.name || "").toUpperCase().replace(/[^A-Z0-9]/g, "_");
    this.#atom.doc.bundleName = bundleName;
    this.#atom.type = this.#atom.type || "workflow";

    this.#apiContext.atom = this.#atom;

    this.#atom.doc.features = this.#atom.doc.features || {};
  }

  #recursiveDelete(filePath) {
    console.log('filePath', filePath);
    if (fs.statSync(filePath).isDirectory()) {
      fs.readdirSync(filePath).forEach(file => {
        const curPath = path.join(filePath, file);
        this.#recursiveDelete(curPath);
      });
      fs.rmSync(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  }
  #copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
      fs.mkdirSync(dest, { recursive: true });
      fs.readdirSync(src).forEach(childItemName => {
        this.#copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  async initWorkflowDir() {

    this.setProgress({ message: "Initializing library directory." });

    const projectDir = this.#context.projectDir;
    const coreDir = this.#context.coreDir;

    this.setProgress({ message: "Cleaning project directory." });

    const assets = fnetListFiles({ dir: projectDir, ignore: ['.cache', 'node_modules', '.conda'], absolute: true });

    for (const asset of assets) {
      fs.rmSync(asset, { recursive: true, force: true });
    }

    this.setProgress({ message: "Creating project directory." });

    // Create projectDir if it doesn't exist.
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    // Create src directory.
    const srcDir = path.join(projectDir, 'src');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }

    // Copy coreDir to src/core
    const srcCoreDir = path.join(srcDir, 'core');
    this.#copyRecursiveSync(coreDir, srcCoreDir);

    // Create src/default/blocks directory.
    const blocksDir = path.join(srcDir, 'default', 'blocks');
    if (!fs.existsSync(blocksDir)) {
      fs.mkdirSync(blocksDir, { recursive: true });
    }
  }

  async initNunjucks() {
    this.setProgress({ message: "Initializing nunjucks." });

    const templateDir = this.#context.templateDir;
    this.#njEnv = nunjucks.configure(templateDir, { watch: false, dev: true });
    this.#apiContext.njEnv = this.#njEnv;
  }

  /**
   * Transforms the given workflow by applying transformation rules on each step.
   * @param {Object} workflow - The workflow to be transformed.
   */
  transformWorkflow({ workflow }) {
    for (const flow of Object.values(workflow)) {
      // Ensure steps exist as an array.
      flow.steps = flow.steps || [];
      flow.steps = flow.steps.filter(w => Object.keys(w).length > 0);

      // Transform each step.
      flow.steps = flow.steps.map(step => this.transformStep({ step }));
    }
  }

  /**
   * Transforms the given step based on certain rules.
   * For example, replaces 'onerror' with 'try-except' structure.
   * @param {Object} step - The step to be transformed.
   * @returns {Object} The transformed step.
   */
  transformStep({ step }) {
    // Validate input.
    if (Array.isArray(step)) throw new Error('Step must be an object.');

    const [stepName, stepDefinition] = Object.entries(step)[0];

    // Transform 'onerror' into 'try-except'.
    if (stepDefinition.hasOwnProperty('onerror')) {
      const { onerror, ...rest } = stepDefinition;
      step[stepName] = {
        try: rest,
        except: onerror
      };
    }

    // Recursively transform child steps if they exist.
    if (step[stepName].hasOwnProperty('steps')) {
      const childSteps = step[stepName].steps;
      if (!Array.isArray(childSteps)) throw new Error('Steps must be an array.');
      step[stepName].steps = childSteps.map(childStep => this.transformStep({ step: childStep }));
    }

    return step;
  }

  async initNodeTree({ workflow }) {

    const workflowKeys = Object.keys(workflow);

    const root = {
      definition: workflow,
      name: undefined,
      type: "root",
      parent: undefined,
      childs: [],
      blockAutoJumpToParent: true,
      blockAutoJumpToSibling: true,
      index: 0,
      depth: 0,
      context: {
        libs: [],
        atom: this.#atom
      }
    };

    workflowKeys.forEach(flowName => {
      const node = {
        name: flowName,
        type: flowName === 'main' ? 'workflow' : "subworkflow",
        childs: [],
        parent: root,
        definition: workflow[flowName],
        index: root.childs.length,
        depth: root.depth + 1,
        context: {},
        blockAutoJumpToParent: true,
        blockAutoJumpToSibling: false,
      }

      root.childs.push(node);
    });

    for await (const node of root.childs) {
      await this.initNode({ node });
    }

    return root;
  }

  async initNode({ node }) {

    const api = { ...this.#blockBuilderContext, node };

    node.workflow = node.parent.workflow || node; //?
    node.depth = node.parent.depth + 1;

    if (await tryExceptBlock.hits(api)) await tryExceptBlock.init(api);
    else if (await forBlock.hits(api)) await forBlock.init(api);
    else if (await switchBlock.hits(api)) await switchBlock.init(api);
    else if (await ifBlock.hits(api)) await ifBlock.init(api);
    else if (await parralelBlock.hits(api)) await parralelBlock.init(api);
    else if (await assignBlock.hits(api)) await assignBlock.init(api);
    else if (await raiseBlock.hits(api)) await raiseBlock.init(api);
    else if (await callBlock.hits(api)) await callBlock.init(api);
    else if (this.#npmBlocks.find(w => w.hits(api))) await (this.#npmBlocks.find(w => w.hits(api))).init(api);
    else if (await formBlock.hits(api)) await formBlock.init(api);
    else if (await operationBlock.hits(api)) await operationBlock.init(api);
    else if (await stepsBlock.hits(api)) await stepsBlock.init(api);
    else if (await jumpBlock.hits(api)) await jumpBlock.init(api);
    else if (await modulesBlock.hits(api)) await modulesBlock.init(api);
    else if (await returnBlock.hits(api)) await returnBlock.init(api);
    else throw new Error('Undefined step type.');
  }

  async initNodeTreeIndex({ root }) {
    const index = {};

    root.indexKey = "/";
    for await (const child of root.childs) {
      await this.initNodeIndex({ node: child, index });
    }

    root.context.index = index;

    return index;
  }

  async initNodeIndex({ node, index }) {

    const indexKey = path.join(node.parent.indexKey, node.name);
    node.indexKey = indexKey;
    index[indexKey] = node;

    const levels = [];
    let current = node;
    while (current?.parent) {
      levels.push(current.index);
      current = current.parent;
    }
    levels.reverse();

    node.codeKey = `B_${levels.join('_')}_${node.type}`;
    node.pathKey = `${levels.join('.')}`;
    node.typeId = nanoid(24);

    for await (const child of node.childs) {
      await this.initNodeIndex({ node: child, index });
    }
  }

  async initNodeCalls({ root }) {

    const index = root.context.index;

    const callNodes = [];
    for await (const indexKey of Object.keys(index)) {
      const node = index[indexKey];
      if (node.type !== 'call') continue;

      callNodes.push(node);
    }

    root.context.calls = callNodes;

    return callNodes;
  }

  async initNodeCallLibs({ root }) {
    const libs = [];
    const calls = root.context.calls;

    for await (const node of calls) {
      const callName = node.definition.import || node.definition.call;

      const targetNode =
        await this.findNodeCallTarget({ refNode: node, curNode: node.parent }) ||
        {
          name: callName,
          type: "atom",
          definition: node.definition,
        };

      const foundTargetNode = libs.find(w => w.name === targetNode.name && w.type === targetNode.type);
      if (!foundTargetNode) libs.push(targetNode);

      node.target = foundTargetNode || targetNode;
    }

    root.context.callLibs = libs;
    root.context.libs = [...root.context.libs, ...libs];
    return libs;
  }

  async findNodeCallTarget({ refNode, curNode }) {
    if (!curNode) return;

    const callName = refNode.definition.call;

    const found = curNode.childs.find(w => w.name === callName && w.type === 'subworkflow');

    if (found) return found;
    else return await this.findNodeCallTarget({ refNode, curNode: curNode.parent });
  }

  async initNodeForms({ root }) {

    const index = root.context.index;

    const formNodes = [];
    for await (const indexKey of Object.keys(index)) {
      const node = index[indexKey];
      if (node.type !== 'form') continue;

      formNodes.push(node);
    }

    root.context.forms = formNodes;

    return formNodes;
  }

  async initNodeFormLibs({ root }) {
    const libs = [];

    const forms = root.context.forms;

    for await (const node of forms) {
      const formName = node.definition.import || node.definition.form;

      const targetNode =
        await this.findNodeCallTarget({ refNode: node, curNode: node.parent }) ||
        {
          name: formName,
          type: "atom"
        };

      const foundTargetNode = libs.find(w => w.name === targetNode.name && w.type === targetNode.type);
      if (!foundTargetNode) libs.push(targetNode);

      node.target = foundTargetNode || targetNode;
    }

    root.context.formLibs = libs;
    root.context.libs = [...root.context.libs, ...libs];

    return libs;
  }

  async initFeaturesFromNodes({ childs, features }) {

    for await (const child of childs) {

      if (child.type === 'form' && !Reflect.has(features, 'form')) features.form = true;

      await this.initFeaturesFromNodes({ childs: child.childs, features });
    }
  }

  async initEntryFiles({ root, features }) {

    for await (const flow of root.childs) {

      let fileName;

      if (flow.name === 'main') fileName = `index.js`;
      else if (flow.name === 'cli') fileName = `cli.js`;
      else if (flow.name === 'app') fileName = `app.js`;
      else if (flow.name === 'api') fileName = `api.js`;
      else continue;

      features[`${flow.name}_default_entry_file`] = fileName;

      flow.entryFile = fileName;
    }
  }

  async findNodeFormTarget({ refNode, curNode }) {
    if (!curNode) return;

    const formName = refNode.definition.form;

    const found = curNode.childs.find(w => w.name === formName && w.type === 'subworkflow');

    if (found) return found;
    else return await this.findNodeFormTarget({ refNode, curNode: curNode.parent });
  }

  async initAtomLibsAndDeps({ libs, packageDependencies }) {
    const atomLibRefs = libs.filter(w => w.type === 'atom');
    for (let i = 0; i < atomLibRefs.length; i++) {
      const atomLibRef = atomLibRefs[i];

      const atomLib = await this.findAtomLibrary({ url: atomLibRef.name, libRef: atomLibRef });
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

  async findAtomLibrary({ url, libRef }) {
    const parsedUrl = fnetParseNodeUrl({ url: url });
    if (!parsedUrl) throw new Error(`Invalid package name: ${url}`);

    if (!parsedUrl.protocol) parsedUrl.protocol = this.#protocol;

    if (parsedUrl.protocol === 'ac:') {
      const parts = parsedUrl.pathname.split('/');
      if (parts.length === 1) {
        return await Atom.first({ where: { name: url, parent_id: this.#atomConfig.env.ATOM_LIBRARIES_ID, type: "workflow.lib" } });
      }

      if (parts.length === 2) {
        const folder = await Atom.first({ where: { name: parts[0], parent_id: this.#atomConfig.env.ATOM_LIBRARIES_ID, type: "folder" } });
        return await Atom.first({ where: { name: parts[1], parent_id: folder.id, type: "workflow.lib" } });
      }
    }
    else if (parsedUrl.protocol === 'local:') {

      const srcFilePath = path.resolve(this.#context.projectSrcDir, `${parsedUrl.pathname}.js`);
      const dependencies = [];

      const parsedImports = await fnetParseImports({ file: srcFilePath, recursive: true });
      const targetImports = parsedImports.all;

      for await (const parsedImport of targetImports) {
        if (parsedImport.type !== 'npm') continue;

        if (dependencies.find(w => w.package === parsedImport.package)) continue;

        const npmVersions = await pickNpmVersions({
          name: parsedImport.package,
          projectDir: this.#context.projectDir,
          setProgress: this.#apiContext.setProgress
        });

        dependencies.push({
          package: parsedImport.package,
          subpath: parsedImport.subpath,
          version: npmVersions.minorRange,
          type: "npm"
        })
      }

      const atom = {
        name: parsedUrl.pathname,
        doc: {
          type: "workflow.lib",
          "content-type": "javascript",
          language: "js",
          dependencies,
        },
        protocol: parsedUrl.protocol,
      }
      return atom;
    }
    else if (parsedUrl.protocol === 'npm:') {

      const npmVersions = await pickNpmVersions({
        name: parsedUrl.pathname,
        projectDir: this.#context.projectDir,
        setProgress: this.#apiContext.setProgress
      });

      const atom = {
        name: parsedUrl.pathname,
        doc: {
          type: "workflow.lib",
          subtype: libRef?.definition?.subtype === 'flow' ? "workflow" : null,
          "content-type": "javascript",
          language: "js",
          dependencies: [
            {
              package: parsedUrl.pathname,
              version: npmVersions.minorRange,
              type: "npm"
            }
          ],
        },
        protocol: parsedUrl.protocol,
      }
      return atom;
    }
    else if (parsedUrl.protocol === 'use:') {
      const atom = {
        name: parsedUrl.pathname,
        doc: {
          type: "function",
          dependencies: []
        },
        protocol: parsedUrl.protocol,
      }
      return atom;
    }
  }

  async resolveNodeTree({ root }) {
    for await (const node of root.childs) {
      await this.resolveTypeWorkflow({ node });
    }
  }

  async resolveTypeWorkflow({ node }) {
    node.context.transform = node.context.transform || cloneDeep(node.definition);
    const transform = node.context.transform;

    for (let i = 0; i < transform.params?.length; i++) {
      const param = transform.params[i];
      if (typeof param === 'string') transform.params[i] = { key: param, hasDefault: false };
      else {
        const paramKey = Object.keys(param)[0];
        transform.params[i] = { key: paramKey, hasDefault: true, default: param[paramKey], type: typeof param[paramKey] };
      }
    }

    node.context.next = node.childs[0];

    for await (const child of node.childs) {
      await this.resolveType({ node: child })
    }
  }

  async resolveType({ node }) {

    const api = { ...this.#blockBuilderContext, node };

    if (typeof node.resolve === 'function') await node.resolve(api);

    for await (const child of node.childs) {
      await this.resolveType({ node: child })
    }
  }

  async resolveTypeCommon({ node }) {
    const transform = node.context.transform;

    if (transform.hasOwnProperty('operation'))
      transform.operation = await this.transformExpression(transform.operation);

    if (transform.hasOwnProperty('page'))
      transform.page = await this.transformExpression(transform.page);

    if (transform.hasOwnProperty('print'))
      transform.print = await this.transformExpression(transform.print);

    if (transform.hasOwnProperty('sleep'))
      transform.sleep = await this.transformExpression(transform.sleep);

    if (transform.hasOwnProperty('assert'))
      transform.assert = await this.transformExpression(transform.assert);
  }

  // CREATE
  async createAtomLibFiles({ root }) {
    await this.setProgress({ message: "Creating external lib files." });

    this.#atom.typesDir = './types';

    const libs = root.context.libs;
    const atomLibRefs = libs.filter(w => w.type === 'atom');
    for (let i = 0; i < atomLibRefs.length; i++) {
      const atomLibRef = atomLibRefs[i];

      const atomLib = atomLibRef.atom;
      const projectDir = this.#context.projectDir;
      if (atomLib.protocol === 'local:') {
        const srcFilePath = path.resolve(this.#context.projectSrcDir, `${atomLib.fileName || atomLib.name}.js`);
        const relativePath = path.relative(`${this.#context.projectDir}/src/default/blocks`, srcFilePath);

        if (!fs.existsSync(srcFilePath)) {
          fs.mkdirSync(path.dirname(srcFilePath), { recursive: true });
          let template = 'export default async (args)=>{\n';
          template += '}';
          fs.writeFileSync(srcFilePath, template, 'utf8');
        }

        atomLib.relativePath = relativePath.split(path.sep).join('/');

        this.#atom.typesDir = `./types/${path.basename(projectDir)}/src`;
      }
      else if (atomLib.protocol === 'npm:') {
        // nothing
        atomLib.relativePath = atomLib.name;
      }
      else if (atomLib.protocol === 'use:') {
        // nothing
      }
      else {
        const atomLibPath = `${projectDir}/src/libs/${atomLib.id}.js`;
        const content = atomLib.doc.contents?.find(w => w.format === 'esm') || atomLib.doc;
        fs.writeFileSync(path.normalize(atomLibPath), content.content, 'utf8');
      }
    }
  }

  async createEngine({ root }) {

    await this.setProgress({ message: "Creating engine file." });

    const templateDir = this.#context.templateDir;
    const template = nunjucks.compile(
      fs.readFileSync(path.resolve(templateDir, `src/default/engine.js.njk`), "utf8"),
      this.#njEnv
    );

    for (let i = 0; i < root.childs.length; i++) {
      const flow = root.childs[i];

      if (!flow.entryFile) continue;
      const templateRender = template.render({ flow, ui: { package: "@fnet/react-app" } });

      const projectDir = this.#context.projectDir;
      const filePath = path.resolve(projectDir, `src/default/${flow.entryFile}`);
      fs.writeFileSync(filePath, templateRender, 'utf8');
    }
  }

  async createNodeTree({ root }) {
    await this.setProgress({ message: "Creating block files." });

    for await (const node of root.childs) {
      await this.createTypeWorkflow({ node });
    }
  }

  async createTypeWorkflow({ node }) {
    const templateDir = this.#context.templateDir;
    const template = nunjucks.compile(
      fs.readFileSync(path.resolve(templateDir, `src/default/workflow.js.njk`), "utf8"),
      this.#njEnv
    );

    const flowTemplateRender = template.render(node);

    const projectDir = this.#context.projectDir;
    const flowFilePath = path.resolve(projectDir, `src/default/${node.codeKey}.js`);
    fs.writeFileSync(flowFilePath, flowTemplateRender, 'utf8');

    for await (const child of node.childs) {
      await this.createType({ node: child });
    }
  }

  async createType({ node }) {

    switch (node.type) {
      case "assign":
      case "steps":
      case "return":
      case "call":
      case "form":
      case "raise":
      case "switch":
      case "jump":
      case "tryexcept":
      case "for":
      case "operation":
      case "modules":
        this.createBlockFromTemplate({ node });
        break;
      default:
        break;
    }

    for await (const child of node.childs) {
      await this.createType({ node: child });
    }
  }

  createBlockFromTemplate({ node }) {
    const template = this.getBlockTemplate({ node });
    node.context.render = template.render(node);
    this.createStepFile({ node });
  }

  getBlockTemplate({ node }) {
    let template = this.#stepTemplateCache[node.type];
    if (template) return template;

    const templateDir = this.#context.templateDir;

    template = nunjucks.compile(
      fs.readFileSync(path.resolve(templateDir, `src/default/blocks/${node.type}.js.njk`), "utf8"),
      this.#njEnv
    );

    this.#stepTemplateCache[node.type] = template;

    return template;
  }

  createStepFile({ node }) {
    const projectDir = this.#context.projectDir;
    const stepFileName = `${node.codeKey}.js`;
    const stepFilePath = path.resolve(projectDir, `src/default/blocks/${stepFileName}`);
    fs.writeFileSync(stepFilePath, node.context.render, 'utf8');
    node.context.fileName = stepFileName;
    node.context.filePath = stepFilePath;
  }

  async transformExpression(value) {
    let temp = await this.transformValue(value);
    temp = JSON.stringify(temp);
    // temp = this.replaceExpressionLegacy(temp);
    temp = this.replaceSpecialPattern(temp);
    return temp;
  }

  async transformValue(value) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        value[i] = await this.transformValue(value[i]);
      }
    }
    else if (isObject(value)) {
      const keys = Object.keys(value);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const exp = fnetExpression({ expression: key });
        if (exp) {
          if (exp.processor === 'e') {
            const transformedValue = value[key].replace(/(\r\n|\n|\r)/g, "");
            value[exp.statement] = `$::${transformedValue}::`;
            delete value[key];
          }
          else value[key] = await this.transformValue(value[key]);
        }
        else {
          value[key] = await this.transformValue(value[key]);
        }
      }
    }
    else if (typeof value === 'string') {
      const exp = fnetExpression({ expression: value });
      if (exp) {
        const { processor, statement } = exp;
        switch (processor) {
          // @fnet/yaml reserved processors
          // s:: reserved for yaml setter
          // g:: reserved for yaml getter
          // r:: reserved for yaml replacer
          // b:: reserved for yaml builder/blocks
          case 'v':
            value = `$::v.${statement}::`;
            break;
          case 'e':
            value = `$::${statement}::`;
            break;
          case 'm':
            value = `$::c.module['${statement}']::`;
            break;
          case 'fm':
            value = `$::flow.getModule('${statement}')::`;
            break;
          case 'f':
            value = `$::c.form.${statement}::`;
            break;
          case 'for':
            value = `$::caller.for.${statement}::`;
            break;
        }
      }
    }

    return value;
  }

  replaceSpecialPattern(text) {
    const pattern1 = /"\$::(.*?)::"/g;
    let temp = text.replace(pattern1, "$1");
    // remove new lines
    // temp = temp.replace(/(\r\n|\n|\r)/g, "");
    return temp;
  }

  replaceExpressionLegacy(value) {
    // https://regex101.com/r/ZC9Wxb/1
    const regex = /(?<outer>"\${(?<inner>[^{]*)}")/g;
    return value.replaceAll(regex, "$2");
  }

  async createProjectYaml() {

    const fileBase = `flow.yaml`;
    const message = `Creating ${fileBase}`;

    await this.setProgress({ message: message });

    const { content: main, ...content } = this.#atom.doc;

    const templateContext = { content: yaml.stringify(content) }

    const templateDir = this.#context.templateDir;
    const template = nunjucks.compile(
      fs.readFileSync(path.resolve(templateDir, `${fileBase}.njk`), "utf8"),
      this.#njEnv
    );

    const templateRender = template.render(templateContext);

    const projectDir = this.#context.projectDir;
    const filePath = path.resolve(projectDir, `${fileBase}`);
    fs.writeFileSync(filePath, templateRender, 'utf8');
  }

  async createProjectMainYaml() {

    const fileBase = `flow.main.yaml`;
    const message = `Creating ${fileBase}`;

    await this.setProgress({ message: message });

    // const { content: main, ...content } = this.#atom.doc;

    const templateContext = { content: yaml.stringify(this.#workflow) }

    const templateDir = this.#context.templateDir;
    const template = nunjucks.compile(
      fs.readFileSync(path.resolve(templateDir, `${fileBase}.njk`), "utf8"),
      this.#njEnv
    );

    const templateRender = template.render(templateContext);

    const projectDir = this.#context.projectDir;
    const filePath = path.resolve(projectDir, `${fileBase}`);
    fs.writeFileSync(filePath, templateRender, 'utf8');
  }

  async runPrettifier() {
    const projectDir = this.#context.projectDir;

    const result = shell.exec(`prettier --write .`, { cwd: path.resolve(projectDir, "src") });
    if (result.code !== 0) throw new Error(result.stderr);
  }

  async deploy() {

    await this.setProgress({ message: "Deploying." });

    if (this.#context.project?.devops) {
      const devopsProjects = [this.#context.project?.devops];
      for (let i = 0; i < devopsProjects.length; i++) {
        let deploymentProject = devopsProjects[i];
        await this.deployProject({ deploymentProject });

        if (deploymentProject.isDirty === true) {
          await deploymentProject.save();
        }
      }

    } else if (this.#atom.id) {
      const deploymentProjects = await Atom.list({ type: "workflow.deploy", parent_id: this.#atom.id });
      for (let i = 0; i < deploymentProjects.length; i++) {
        let deploymentProject = deploymentProjects[i];
        await this.deployProject({ deploymentProject });

        if (deploymentProject.isDirty === true) {
          deploymentProject = await Atom.update(deploymentProject, { id: deploymentProject.id });
        }
      }
    }
  }

  async deployProject(context) {
    const { deploymentProject } = context;
    const { yamlDocument } = deploymentProject;

    if (deploymentProject.doc.targets && Array.isArray(deploymentProject.doc.targets))
      throw new Error("Deployment project targets are deprecated. Please update targets in the yaml file.");

    const targetKeys = Object.keys(deploymentProject.doc || {});
    const yamlTargets = yamlDocument || {};
    for (let i = 0; i < targetKeys.length; i++) {
      const deploymentProjectTarget = deploymentProject.doc[targetKeys[i]];
      deploymentProjectTarget.name = targetKeys[i];
      const yamlTarget = yamlTargets.get(targetKeys[i]);
      await deployTo({ ...this.#apiContext, deploymentProject, deploymentProjectTarget, yamlTarget });
    }
  }

  async registerToPackageManager(context) {
    const { target, packageJSON } = context;

    if (!this.#context.id) return;

    // update
    let packageAtom = await Atom.first({ name: target.params.name, parent_id: this.#atomConfig.env.ATOM_PACKAGES_ID });

    if (!packageAtom) {
      // create new
      packageAtom = await Atom.create({
        parent_id: this.#atomConfig.env.ATOM_PACKAGES_ID,
        doc: {
          name: target.params.name,
          type: "pm",
          versions: [{ v: packageJSON.version }]
        }
      });
    }
    else {
      // update existing
      packageAtom.doc.versions.splice(0, 0, { v: packageJSON.version });

      await Atom.update(packageAtom, { id: packageAtom.id });
    }
  }

  async setProgress(args) {

    const message = typeof args === 'string' ? args : args?.message;

    console.log(chalk.blue(message));

    await this._cache_set(this.#buildKey, { status: "IN_PROGRESS", message });
  }

  async build() {
    if (this.#bpmnMode && !this.#fileMode) return await this.createNetwork();

    try {
      const network = this.#bpmnMode ? await fnetBpmnFromFlow({ root: this.#root }) : undefined;

      if (this.#fileMode) {

        await this.initWorkflowDir();
        await this.initNunjucks();

        if (this.#bpmnMode) {
          let bpmnDir = this.#context.project?.projectDir || this.#context.projectDir;
          bpmnDir = path.resolve(bpmnDir, 'fnet');
          if (!fs.existsSync(bpmnDir))
            fs.mkdirSync(bpmnDir, { recursive: true });
          fs.writeFileSync(path.resolve(bpmnDir, 'flow.bpmn'), network.diagramXML, 'utf8');
        }

        await this.createAtomLibFiles({ root: this.#root });
        await this.createEngine({ root: this.#root });
        await this.createNodeTree({ root: this.#root });
        await this.createProjectYaml();
        await this.createProjectMainYaml();

        await createProjectReadme(this.#apiContext);
        await createTsConfig(this.#apiContext);
        await createGitIgnore(this.#apiContext);
        await createToYargs(this.#apiContext);
        await createCli(this.#apiContext);
        await createApp(this.#apiContext);
        await createRollup(this.#apiContext);
        await createPackageJson(this.#apiContext);

        await formatFiles(this.#apiContext);

        await createDts(this.#apiContext);

        if (this.#buildMode) {

          await installNpmPackages(this.#apiContext);
          await runNpmBuild(this.#apiContext);

          if (this.#deployMode)
            await this.deploy();
        }
      }

      await this._cache_set(this.#buildKey, { status: "COMPLETED", data: { network } });
    }
    catch (error) {
      await this._cache_set(this.#buildKey, { status: "FAILED", message: error.message || error });
      throw error;
    }
  }

  async createNetwork() {
    try {
      const network = await fnetBpmnFromFlow({ root: this.#root });

      await this._cache_set(this.#buildKey, { status: "COMPLETED", data: { ...network } });
    }
    catch (error) {
      await this._cache_set(this.#buildKey, { status: "FAILED", message: error.message || error });
      throw error;
    }
  }
}
module.exports = Builder;