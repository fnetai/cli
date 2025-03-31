import argv from "../default/to.args.js";
import { default as Engine } from "../default/index.js";

const run = async () => {
  const engine = new Engine();
  return await engine.run(await argv());
};

run()
  .then((result) => {
    if (typeof result !== "undefined") {
      // TODO: REMOVE THIS LINE
      const stdout_format =
        process.argv.slice(2).indexOf() !== -1
          ? process.argv.slice(2)[
              process.argv.slice(2).indexOf("--stdout_format") + 1
            ]
          : null;
      if (stdout_format === "json")
        console.log(JSON.stringify(result, null, 2));
      else console.log(result);
    }
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
