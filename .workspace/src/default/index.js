import Object from "../core/object";

import { default as Workflow } from "./B_0_workflow";

export default class Engine extends Object {
  #main;

  constructor(context) {
    super(context);

    this.#main = new Workflow({ engine: this });
  }

  async #init(context) {}

  // Main entry function to run workflow
  async run(params) {
    await this.#init({ params });

    const response = await this.#main.run({ params });

    return response?.value;
  }

  async destroy() {}
}
