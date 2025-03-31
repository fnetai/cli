import callBlock from '../call/index.js';

class NpmWrapper {
  #key;
  #npm;
  #master;
  #extras;

  constructor({ key, npm, master, extras }) {
    this.#key = key;
    this.#npm = npm;
    this.#master = master;
    this.#extras = extras;
  }

  hits({ node }) {
    return node.definition.hasOwnProperty(this.#key);
  }

  async init(api) {
    const { node } = api;

    const name = this.#key;
    const definition = node.definition;
    const valueType = typeof definition[name];

    definition.call = `npm:${this.#npm}`;
    if (valueType !== 'object') definition.args = { ...definition.args, [`${this.#master}`]: definition[name] };
    else definition.args = definition[name];
    delete definition[name];

    if (this.#extras) {
      for (const extra in this.#extras) {
        definition[extra] = this.#extras[extra];
      }
    }

    console.log(`[npm-block] ${this.#key} --> ${this.#npm}`);
    await callBlock.init(api);
  }
}

export default function createNpmWrapper(args) {
  return new NpmWrapper(args);
}