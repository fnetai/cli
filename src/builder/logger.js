import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize } = winston.format;

// Custom format for tree visualization
const treeFormat = printf(({ level, message, timestamp, category, depth, ...metadata }) => {
  const indent = '  '.repeat(depth || 0);
  const categoryLabel = category ? `[${category}]` : '';
  
  let msg = `${timestamp} ${level} ${categoryLabel} ${indent}${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += `\n${indent}  ${JSON.stringify(metadata, null, 2)}`;
  }
  
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.FNET_LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'HH:mm:ss.SSS' }),
    treeFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss.SSS' }),
        treeFormat
      )
    })
  ]
});

// Category-based logging
export const createCategoryLogger = (category) => {
  return {
    debug: (message, meta = {}) => logger.debug(message, { category, ...meta }),
    info: (message, meta = {}) => logger.info(message, { category, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { category, ...meta }),
    error: (message, meta = {}) => logger.error(message, { category, ...meta }),
  };
};

// Tree-specific logger
export const treeLogger = createCategoryLogger('tree');

// BPMN-specific logger
export const bpmnLogger = createCategoryLogger('bpmn');

// Enable/disable categories via environment variable
// Example: FNET_LOG_CATEGORIES=tree,bpmn
const enabledCategories = process.env.FNET_LOG_CATEGORIES?.split(',') || [];

export const isLogEnabled = (category) => {
  if (enabledCategories.length === 0) return false;
  return enabledCategories.includes(category);
};

export default logger;

