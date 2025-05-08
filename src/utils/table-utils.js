/**
 * Table utilities for CLI output
 * This module provides utilities for creating consistent table outputs
 */
import Table from 'cli-table3';
import chalk from 'chalk';

/**
 * Create a standardized CLI table
 * @param {Array<string>} headers - Table headers
 * @param {Object} options - Additional table options
 * @returns {Table} Configured table instance
 */
export function createTable(headers, options = {}) {
  const defaultOptions = {
    chars: {
      'top': '─',
      'top-mid': '─',
      'top-left': ' ',
      'top-right': ' ',
      'bottom': '─',
      'bottom-mid': '─',
      'bottom-left': ' ',
      'bottom-right': ' ',
      'left': ' ',
      'left-mid': ' ',
      'mid': '─',
      'mid-mid': '─',
      'right': ' ',
      'right-mid': ' ',
      'middle': ' '
    },
    style: {
      head: [],  // No additional styling for headers as we'll use chalk directly
      border: [], // No border styling
    },
    wordWrap: true
  };

  // Merge default options with user options
  const tableOptions = {
    ...defaultOptions,
    ...options,
    head: headers.map(header => chalk.bold(header))
  };

  return new Table(tableOptions);
}

/**
 * Create a table with data
 * @param {Array<string>} headers - Table headers
 * @param {Array<Array<string|Object>>} rows - Table rows
 * @param {Object} options - Additional table options
 * @returns {string} Formatted table string
 */
export function createTableWithData(headers, rows, options = {}) {
  const table = createTable(headers, options);
  
  // Add rows to the table
  if (Array.isArray(rows)) {
    rows.forEach(row => {
      table.push(row);
    });
  }
  
  return table.toString();
}

/**
 * Get color function for status
 * @param {string} status - Service status
 * @returns {Function} Chalk color function
 */
export function getStatusColor(status) {
  switch (status) {
    case 'running':
      return chalk.green;
    case 'stopped':
      return chalk.yellow;
    case 'failed':
      return chalk.red;
    case 'registered':
      return chalk.blue;
    default:
      return chalk.gray;
  }
}

export default {
  createTable,
  createTableWithData,
  getStatusColor
};
