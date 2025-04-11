import nunjucks from "nunjucks";
import fs from 'node:fs';
import path from 'node:path';
import fnetYaml from "@fnet/yaml";

export default async function createProjectReadme({ atom, context, setProgress, Atom }) {

  const fileBase = `readme.md`;
  const message = `Creating ${fileBase}`;

  await setProgress({ message: message });

  if (context.project?.readme) {

    const projectDir = context.projectDir;

    const templateContext = {
      content: context.project.readme.doc.content
    }

    const howtoPath = path.resolve(context.project.projectDir, `fnet/how-to.md`);
    if (fs.existsSync(howtoPath)) {
      const howtoContent = fs.readFileSync(howtoPath, 'utf8');
      templateContext.howto = howtoContent;
    }

    const inputSchemaPath = path.resolve(context.project.projectDir, `fnet/input.yaml`);
    if (fs.existsSync(inputSchemaPath)) {
      const yaml = await fnetYaml({ file: inputSchemaPath, tags: context.tags });
      templateContext.input = yaml.content;
    }

    const outputSchemaPath = path.resolve(context.project.projectDir, `fnet/output.yaml`);
    if (fs.existsSync(outputSchemaPath)) {
      const yaml = await fnetYaml({ file: outputSchemaPath, tags: context.tags });
      templateContext.output = yaml.content;
    }

    const templateDir = context.templateCommonDir;
    const template = nunjucks.compile(
      fs.readFileSync(path.resolve(templateDir, `${fileBase}.njk`), "utf8"),
      nunjucks.configure(templateDir)
    );

    const templateRender = template.render(templateContext);

    const filePath = path.resolve(projectDir, `${fileBase}`);
    fs.writeFileSync(filePath, templateRender, 'utf8');
  }
  else if (atom.id) {
    const wiki = await Atom.first({ type: "wiki", parent_id: atom.id });

    if (!wiki || wiki.doc?.["content-type"] !== 'markdown') return;

    const { content: main, ...content } = wiki.doc;

    const templateContext = { content: main }

    const templateDir = context.templateCommonDir;
    const template = nunjucks.compile(
      fs.readFileSync(path.resolve(templateDir, `${fileBase}.njk`), "utf8"),
      nunjucks.configure(templateDir)
    );

    const templateRender = template.render(templateContext);

    const projectDir = context.projectDir;
    const filePath = path.resolve(projectDir, `${fileBase}`);
    fs.writeFileSync(filePath, templateRender, 'utf8');
  }
}