// import getValue from "get-value";
// import setValue from "set-value";
import { setProperty, getProperty } from "dot-prop";

export default class Object {
  #property;
  #context;
  #module;

  constructor(context) {

    this.#property = {}
    this.#module = {};
    this.#context = context;

    this.get = (path, options) => {
      return getProperty(this.#property, path, options);
    }

    this.set = (path, value, options) => {
      return setProperty(this.#property, path, value, options);
    }

    this.print = console.log;
  }

  get module() {
    return this.#module;
  }

  getModule(path) {
    return getProperty(this.#module, path);
  }

  setModule(path, module) {
    if (typeof module !== "function") throw new Error("Module must be a function");
    return setProperty(this.#module, path, module);
  }

  get getValue() {
    return getProperty;
  }

  get setValue() {
    return setProperty;
  }
}