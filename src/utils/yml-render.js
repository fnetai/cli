/**
 * Render a YAML file via @fnet/yaml (resolving includes and conditional
 * configuration via tags) and either write the result to an output file
 * or return it as a string.
 */
import path from 'node:path';
import fs from 'node:fs';
import fnetYaml from '@fnet/yaml';
import yaml from 'yaml';
import { withSystemTags } from './auto-tags.js';

/**
 * @param {Object} options
 * @param {string} options.input - Input YAML path (resolved against cwd)
 * @param {string} [options.output] - Output path (resolved against cwd). When omitted, the rendered YAML is only returned.
 * @param {Array<string>} [options.tags] - Tags for conditional configuration
 * @returns {Promise<string>} Rendered YAML content
 */
export async function renderYml({ input, output, tags }) {
  if (!input) throw new Error('--input is required');

  const cwd = process.cwd();
  const inputPath = path.resolve(cwd, input);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  let outputPath;
  if (output) {
    outputPath = path.resolve(cwd, output);
    if (inputPath === outputPath) {
      throw new Error('Input and output paths cannot be the same.');
    }
  }

  const { parsed } = await fnetYaml({
    file: inputPath,
    tags: withSystemTags(tags)
  });

  const rendered = yaml.stringify(parsed);

  if (outputPath) {
    fs.writeFileSync(outputPath, rendered);
  }

  return rendered;
}
