import fnetArgs from "@fnet/args";
import validate from "./validate_input";

export default async () => {
  let schema = { type: "object", properties: {}, required: [] };
  let initial;

  const packageCallback = async () => {
    const { default: url } = await import("node:url");
    const { default: path } = await import("node:path");
    const { default: fs } = await import("node:fs");
    let currentDir = path.dirname(url.fileURLToPath(import.meta.url));
    let firstPackageJson = path.join(currentDir, "package.json");
    while (
      currentDir !== path.parse(currentDir).root &&
      !fs.existsSync(firstPackageJson)
    ) {
      currentDir = path.dirname(currentDir);
      firstPackageJson = path.join(currentDir, "package.json");
    }
    if (!fs.existsSync(firstPackageJson))
      return {
        name: "Unknown",
        version: "Unknown",
      };
    else return await JSON.parse(fs.readFileSync(firstPackageJson, "utf8"));
  };

  return await fnetArgs({ schema, initial, validate, packageCallback });
};
