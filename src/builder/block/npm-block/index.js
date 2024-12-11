const callBlock = require('../call');

class NpmWrapper {

  #key;
  #npm;
  #master;

  constructor({ key, npm, master }) {
    this.#key = key;
    this.#npm = npm;
    this.#master = master;
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

    console.log(`[npm-block] ${this.#key} --> ${this.#npm}`);
    await callBlock.init(api);
  }
}

module.exports = (args) => {
  return new NpmWrapper(args);
}