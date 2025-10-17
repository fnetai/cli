import { treeLogger, isLogEnabled } from '../../logger.js';

export default function resolveNextBlock({ node }) {
  const definition = node.definition;

  if (node.hasReturn) {
    if (isLogEnabled('tree')) {
      treeLogger.info(`    └─ RETURN (no next)`, {
        depth: node.depth + 1,
        node: node.indexKey
      });
    }
    return;
  }

  // console.log(node.indexKey,node.hasModules,node.module, definition.next);

  if (definition.next === 'end') {
    if (isLogEnabled('tree')) {
      treeLogger.info(`    └─ EXPLICIT END`, { depth: node.depth + 1, node: node.indexKey });
    }
  }
  else if (definition.next === 'stop') {
    if (isLogEnabled('tree')) {
      treeLogger.info(`    └─ EXPLICIT STOP`, { depth: node.depth + 1, node: node.indexKey });
    }
  }
  else if (definition.next === 'none') {
    if (isLogEnabled('tree')) {
      treeLogger.info(`    └─ EXPLICIT NONE`, { depth: node.depth + 1, node: node.indexKey });
    }
  }
  else if (definition.next) {

    // FIND NEXT BLOCK BY NAME
    // TRY SIBLINGS UNTIL ROOT
    if (isLogEnabled('tree')) {
      treeLogger.info(`    🔍 EXPLICIT NEXT: "${definition.next}" (searching...)`, {
        depth: node.depth + 1,
        from: node.indexKey
      });
    }

    let current = node.parent;
    while (current.parent) {
      const found = current.childs.find(w => w.name === definition.next);

      if (found) {
        node.context.next = found;
        if (isLogEnabled('tree')) {
          treeLogger.info(`    └─ ✅ FOUND: ${found.indexKey}`, {
            depth: node.depth + 1,
            nextNode: found.indexKey
          });
        }
        break;
      }

      current = current.parent;
    }

    if (!node.context.next && isLogEnabled('tree')) {
      treeLogger.warn(`    └─ ⚠️  NOT FOUND: "${definition.next}"`, {
        depth: node.depth + 1
      });
    }
  }
  else {

    // AUTO NEXT BLOCK IS DISABLED FOR MODULE ROOT
    if (node.module === true) {
      if (isLogEnabled('tree')) {
        treeLogger.info(`    └─ MODULE ROOT (no auto next)`, {
          depth: node.depth + 1,
          node: node.indexKey
        });
      }
      return;
    }

    // AUTO FINDING NEXT BLOCK
    if (isLogEnabled('tree')) {
      treeLogger.info(`    🐜 AUTO NEXT (karınca yürüyüşü başlıyor...)`, {
        depth: node.depth + 1,
        from: node.indexKey
      });
    }

    let parent = node.parent;
    let targetIndex = node.index + 1;
    let step = 0;

    while (parent.parent) {
      step++;

      // if (parent.module === true) break;

      // NEITHER JUMP TO PARENT NOR SIBLING ENABLED
      if (parent.blockAutoJumpToParent && parent.blockAutoJumpToSibling) {
        if (isLogEnabled('tree')) {
          treeLogger.info(`      ${step}. ⛔ Both jumps disabled at ${parent.indexKey}`, {
            depth: node.depth + 2
          });
        }
        break;
      }
      else if (!Reflect.has(parent, 'blockAutoJumpToParent') && !Reflect.has(parent, 'blockAutoJumpToSibling')) {

        const found = parent.childs.find(w => w.index === targetIndex);
        if (found) {
          // JUMP TO SIBLING
          node.context.next = found;
          if (isLogEnabled('tree')) {
            treeLogger.info(`      ${step}. ✅ SIBLING FOUND: ${found.indexKey}`, {
              depth: node.depth + 2,
              nextNode: found.indexKey
            });
          }
          break;
        } else {
          // JUMP TO PARENT
          if (isLogEnabled('tree')) {
            treeLogger.info(`      ${step}. ⬆️  No sibling, climbing to parent: ${parent.parent?.indexKey}`, {
              depth: node.depth + 2,
              targetIndex
            });
          }
          targetIndex = parent.index + 1;
          parent = parent.parent;
          continue;
        }
      }
      else if (parent.blockAutoJumpToParent) {
        // JUMP TO PARENT DISABLED
        // SIBLING ENABLED
        const found = parent.childs.find(w => w.index === targetIndex);
        if (found) {
          node.context.next = found;
          if (isLogEnabled('tree')) {
            treeLogger.info(`      ${step}. ✅ SIBLING FOUND (parent jump disabled): ${found.indexKey}`, {
              depth: node.depth + 2,
              nextNode: found.indexKey
            });
          }
        } else {
          if (isLogEnabled('tree')) {
            treeLogger.info(`      ${step}. ⛔ No sibling, parent jump disabled`, {
              depth: node.depth + 2
            });
          }
        }
        break;
      }
      else if (!parent.blockAutoJumpToParent) {
        // JUMP TO PARENT ENABLED
        // SIBLING DISABLED
        if (isLogEnabled('tree')) {
          treeLogger.info(`      ${step}. ⬆️  Sibling disabled, climbing to parent: ${parent.parent?.indexKey}`, {
            depth: node.depth + 2
          });
        }
        targetIndex = parent.index + 1;
        parent = parent.parent;
        continue;
      }
    }

    if (node.context.next && isLogEnabled('tree')) {
      treeLogger.info(`    └─ 🎯 AUTO NEXT RESOLVED: ${node.context.next.indexKey}`, {
        depth: node.depth + 1,
        steps: step,
        nextNode: node.context.next.indexKey
      });
    } else if (isLogEnabled('tree')) {
      treeLogger.info(`    └─ ⚠️  NO NEXT FOUND (end of flow)`, {
        depth: node.depth + 1,
        steps: step
      });
    }
  }
}