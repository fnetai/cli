/**
 * Prompt utilities for CLI tools
 * This module provides utility functions for prompting users in CLI tools
 */
import chalk from 'chalk';
import fnetPrompt from '@fnet/prompt';

/**
 * Prompt user to select an item from a list
 * 
 * @param {Object} options - Options
 * @param {Array<string|Object>} options.items - List of items to select from
 * @param {string} options.message - Prompt message
 * @param {string} [options.nameField='name'] - Field name for item name (if items are objects)
 * @param {string} [options.valueField='name'] - Field name for item value (if items are objects)
 * @param {string} [options.initialValue] - Initial value to select
 * @param {boolean} [options.allowAbort=true] - Allow user to abort selection
 * @returns {Promise<string|null>} Selected item or null if aborted
 */
export async function promptForSelection(options) {
  const {
    items,
    message,
    nameField = 'name',
    valueField = 'name',
    initialValue = null,
    allowAbort = true
  } = options;

  // Check if items is empty
  if (!items || items.length === 0) {
    console.log(chalk.yellow('No items available for selection.'));
    return null;
  }

  // If there's only one item and allowAbort is false, return it directly
  if (items.length === 1 && !allowAbort) {
    const item = items[0];
    const value = typeof item === 'string' ? item : item[valueField];
    console.log(chalk.blue(`Only one option available: ${typeof item === 'string' ? item : item[nameField]}`));
    return value;
  }

  // Prepare choices for prompt
  let choices = items.map(item => {
    if (typeof item === 'string') {
      return {
        name: item,
        value: item,
        message: item
      };
    } else {
      return {
        name: item[valueField],
        value: item[valueField],
        message: item[nameField] || item[valueField]
      };
    }
  });

  // Add abort option if allowed
  if (allowAbort) {
    choices.push({
      name: 'abort',
      value: null,
      message: chalk.yellow('Cancel')
    });
  }

  // Determine initial choice
  let initialChoice = null;
  if (initialValue) {
    const initialIndex = choices.findIndex(choice => choice.name === initialValue);
    if (initialIndex !== -1) {
      initialChoice = initialIndex;
    }
  }

  // Prompt user to select an item
  const promptName = 'selectedItem';
  const { [promptName]: selectedValue } = await fnetPrompt({
    type: 'select',
    name: promptName,
    message,
    choices,
    initial: initialChoice
  });

  return selectedValue;
}

/**
 * Prompt user to select multiple items from a list
 * 
 * @param {Object} options - Options
 * @param {Array<string|Object>} options.items - List of items to select from
 * @param {string} options.message - Prompt message
 * @param {string} [options.nameField='name'] - Field name for item name (if items are objects)
 * @param {string} [options.valueField='name'] - Field name for item value (if items are objects)
 * @param {Array<string>} [options.initialValues=[]] - Initial values to select
 * @param {boolean} [options.allowAbort=true] - Allow user to abort selection
 * @returns {Promise<Array<string>|null>} Selected items or null if aborted
 */
export async function promptForMultipleSelection(options) {
  const {
    items,
    message,
    nameField = 'name',
    valueField = 'name',
    initialValues = [],
    allowAbort = true
  } = options;

  // Check if items is empty
  if (!items || items.length === 0) {
    console.log(chalk.yellow('No items available for selection.'));
    return null;
  }

  // Prepare choices for prompt
  let choices = items.map(item => {
    if (typeof item === 'string') {
      return {
        name: item,
        value: item,
        message: item
      };
    } else {
      return {
        name: item[valueField],
        value: item[valueField],
        message: item[nameField] || item[valueField]
      };
    }
  });

  // Determine initial choices
  let initial = [];
  if (initialValues && initialValues.length > 0) {
    initial = choices
      .map((choice, index) => initialValues.includes(choice.name) ? index : -1)
      .filter(index => index !== -1);
  }

  // Prompt user to select items
  const promptName = 'selectedItems';
  const result = await fnetPrompt({
    type: 'multiselect',
    name: promptName,
    message,
    choices,
    initial,
    hint: '(Use space to select, enter to confirm)',
    validate: selected => {
      if (selected.length === 0 && !allowAbort) {
        return 'Please select at least one item';
      }
      return true;
    }
  });

  // Handle abort
  if (allowAbort && result[promptName].length === 0) {
    return null;
  }

  return result[promptName];
}

export default {
  promptForSelection,
  promptForMultipleSelection
};
