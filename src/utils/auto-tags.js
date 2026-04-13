/**
 * Auto-tag utilities
 * Automatically adds system platform and architecture tags
 */
import os from 'os';

/**
 * Ensure system tags (platform + arch) are included in the tags array
 * @param {Array} [tags=[]] - Existing tags array
 * @returns {Array} Tags array with platform and arch added
 */
export function withSystemTags(tags = []) {
  const result = [...tags];
  const platform = os.platform();  // darwin, linux, win32
  const arch = os.arch();          // arm64, x64
  if (!result.includes(platform)) result.push(platform);
  if (!result.includes(arch)) result.push(arch);
  return result;
}
