import getValue from "get-value";
import setValue from "set-value";
import print from "./print";

export default class Object {
  #property;
  #context;
  #module;

  constructor(context) {

    this.#property = {}
    this.#module = {};
    this.#context = context;

    this.get = (path, options) => {
      return getValue(this.#property, path, options);
    }

    this.set = (path, value, options) => {
      return setValue(this.#property, path, value, options);
    }

    this.print = print;
  }

  get module() {
    return this.#module;
  }

  getModule(path) {
    return getValue(this.#module, path);
  }

  setModule(path, module) {
    if (typeof module !== "function") throw new Error("Module must be a function");
    return setValue(this.#module, path, module);
  }

  get getValue() {
    return getValue;
  }

  get setValue() {
    return setValue;
  }
}