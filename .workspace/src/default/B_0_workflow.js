// WORKFLOW: /main

import Object from "../core/object";

export default class Workflow extends Object {
  #waitContext;

  constructor(context) {
    super(context);

    this.engine = context.engine;
  }

  async init(context) {}

  waitForNext(context) {
    this.#waitContext = context;
  }

  async continueForNext(context) {
    const next = this.#waitContext?.next;
    this.#waitContext = undefined;
    next && (await next());
  }

  async run(context) {
    await this.init(context);

    return this.result;
  }
}

Workflow.TypeId = "08dc32da-a729-48d4-b924-7df858400e56";
Workflow.IndexKey = "/main";
