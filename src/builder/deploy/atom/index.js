const fs = require("fs");
const path = require("path");
const fnetConfig = require('@fnet/config');

module.exports = async ({ atom, Atom, setProgress, context, packageDependencies, deploymentProject, deploymentProjectTarget: target }) => {
  await setProgress({ message: "Deploying it as workflow lib." });

  const atomConfig = (await fnetConfig({ name: "atom", dir: context.projectDir, tags: context.tags }))?.data;

  let wflibAtom;

  let parentId;
  let name;
  let nameParts = target.deploy.name.split('/');

  if (nameParts.length === 1) {
    parentId = atomConfig.env.ATOM_LIBRARIES_ID;
    name = target.deploy.name;
  }
  else if (nameParts.length === 2) {
    const folder = await Atom.first({ where: { name: nameParts[0], parent_id: atomConfig.env.ATOM_LIBRARIES_ID, type: "folder" }, limit: 1 });
    if (!folder) throw new Error('Couldnt file lib folder.');

    parentId = folder.id;
    name = nameParts[1];
  }
  else throw new Error('Wrong name path.');

  if (target.dryRun === true) return;

  deploymentProject.isDirty = true;

  if (!target.deploy.id) {

    wflibAtom = await Atom.create({
      parent_id: parentId,
      doc: {
        name: name,
        type: "workflow.lib",
        "content-type": "javascript",
        dependencies: [],
        content: undefined,
        subtype: "workflow"
      }
    });

    if (!wflibAtom) return;

    target.deploy.id = wflibAtom.id;
  }
  else {
    wflibAtom = await Atom.get({ id: target.deploy.id });

    if (!wflibAtom) return;
  }

  const projectDir = context.projectDir;

  wflibAtom.doc.contents = [
    {
      content: fs.readFileSync(path.resolve(projectDir, 'dist/default/esm/index.js'), { encoding: 'utf8', flag: 'r' }),
      ["content-type"]: "javascript",
      format: "esm"
    },
    {
      content: fs.readFileSync(path.resolve(projectDir, 'dist/default/cjs/index.js'), { encoding: 'utf8', flag: 'r' }),
      ["content-type"]: "javascript",
      format: "cjs"
    },
    {
      content: fs.readFileSync(path.resolve(projectDir, 'dist/default/iife/index.js'), { encoding: 'utf8', flag: 'r' }),
      ["content-type"]: "javascript",
      format: "iife"
    }
  ]

  wflibAtom.doc.name = name;
  wflibAtom.doc.dependencies = packageDependencies;
  if (atom.type === "workflow.lib") wflibAtom.doc.subtype = "library";
  else if (atom.type === 'workflow') wflibAtom.doc.subtype = "workflow";

  wflibAtom = await Atom.update(wflibAtom, { id: wflibAtom.id });
}