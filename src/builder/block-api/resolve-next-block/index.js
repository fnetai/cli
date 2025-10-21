import { treeLogger, isLogEnabled } from '../../logger.js';

export default function resolveNextBlock({ node }) {
  const definition = node.definition;

  if (node.hasReturn) {
    if (isLogEnabled('tree')) treeLogger.info(`[RETURN] no next: ${node.indexKey}`);
    return;
  }

  if (definition.next === 'end') {
    if (isLogEnabled('tree')) treeLogger.info(`[EXPLICIT-END] ${node.indexKey}`);
  }
  else if (definition.next === 'stop') {
    if (isLogEnabled('tree')) treeLogger.info(`[EXPLICIT-STOP] ${node.indexKey}`);
  }
  else if (definition.next === 'none') {
    if (isLogEnabled('tree')) treeLogger.info(`[EXPLICIT-NONE] ${node.indexKey}`);
  }
  else if (definition.next) {

    // FIND NEXT BLOCK BY NAME
    // TRY SIBLINGS UNTIL ROOT
    if (isLogEnabled('tree')) treeLogger.info(`[EXPLICIT-NEXT] "${definition.next}" from ${node.indexKey}`);

    let current = node.parent;
    while (current.parent) {
      const found = current.childs.find(w => w.name === definition.next);

      if (found) {
        node.context.next = found;
        if (isLogEnabled('tree')) treeLogger.info(`[FOUND] ${found.indexKey}`);
        break;
      }

      current = current.parent;
    }

    if (!node.context.next && isLogEnabled('tree')) treeLogger.warn(`    [NOT-FOUND] "${definition.next}"`);
  }
  else {

    // AUTO NEXT BLOCK IS DISABLED FOR MODULE ROOT
    if (node.module === true) {
      if (isLogEnabled('tree')) treeLogger.info(`[MODULE-ROOT] no auto next: ${node.indexKey}`);
      return;
    }

    // AUTO FINDING NEXT BLOCK
    if (isLogEnabled('tree')) treeLogger.info(`[AUTO-NEXT] from ${node.indexKey}`);


    let parent = node.parent;
    let targetIndex = node.index + 1;
    let step = 0;

    while (parent.parent) {
      step++;

      // NEITHER JUMP TO PARENT NOR SIBLING ENABLED
      if (parent.block_child_auto_jump_to_parent && parent.block_child_auto_jump_to_sibling) {
        if (isLogEnabled('tree')) treeLogger.info(`${step}. [BLOCKED] both jumps disabled at ${parent.indexKey}`);
        break;
      }
      else if (!Reflect.has(parent, 'block_child_auto_jump_to_parent') && !Reflect.has(parent, 'block_child_auto_jump_to_sibling')) {

        const found = parent.childs.find(w => w.index === targetIndex);
        if (found) {
          // JUMP TO SIBLING
          node.context.next = found;
          if (isLogEnabled('tree')) treeLogger.info(`${step}. [SIBLING-FOUND] ${found.indexKey}`);
          break;
        } else {
          // JUMP TO PARENT
          if (isLogEnabled('tree')) treeLogger.info(`${step}. [CLIMB] no sibling, climbing to parent: ${parent.parent?.indexKey}`);
          targetIndex = parent.index + 1;
          parent = parent.parent;
          continue;
        }
      }
      else if (parent.block_child_auto_jump_to_parent) {
        // JUMP TO PARENT DISABLED
        // SIBLING ENABLED
        const found = parent.childs.find(w => w.index === targetIndex);
        if (found) {
          node.context.next = found;
          if (isLogEnabled('tree')) treeLogger.info(`${step}. [SIBLING-FOUND] parent jump disabled: ${found.indexKey}`);
        } else {
          if (isLogEnabled('tree')) treeLogger.info(`${step}. [BLOCKED] no sibling, parent jump disabled`);
        }
        break;
      }
      else if (!parent.block_child_auto_jump_to_parent) {
        // JUMP TO PARENT ENABLED
        // SIBLING DISABLED
        if (isLogEnabled('tree')) treeLogger.info(`${step}. [CLIMB] sibling disabled, climbing to parent: ${parent.parent?.indexKey}`);
        targetIndex = parent.index + 1;
        parent = parent.parent;
        continue;
      }
    }

    if (node.context.next && isLogEnabled('tree')) {
      treeLogger.info(`[RESOLVED] auto next: ${node.context.next.indexKey} (${step} steps)`);
    } else if (isLogEnabled('tree')) {
      treeLogger.info(`[NO-NEXT] end of flow (${step} steps)`);
    }
  }
}