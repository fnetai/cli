module.exports = ({ node }) => {
  const definition = node.definition;

  if (definition.next === 'end') { }
  else if (definition.next === 'stop') { }
  else if (definition.next === 'none') { }
  else if (definition.next) {

    // FIND NEXT BLOCK BY NAME
    // TRY SIBLINGS UNTIL ROOT
    let current = node.parent;
    while (current.parent) {
      const found = current.childs.find(w => w.name === definition.next);

      if (found) {
        node.context.next = found;
        break;
      }

      current = current.parent;
    }
  }
  else {

    // AUTO NEXT BLOCK IS DISABLED FOR MODULE ROOT
    if (node.module === true) {
      return;
    }

    // AUTO FINDING NEXT BLOCK
    let parent = node.parent;
    let targetIndex = node.index + 1;

    while (parent.parent) {

      // NEITHER JUMP TO PARENT NOR SIBLING ENABLED
      if (parent.blockAutoJumpToParent && parent.blockAutoJumpToSibling)
        break;
      else if (!Reflect.has(parent, 'blockAutoJumpToParent') && !Reflect.has(parent, 'blockAutoJumpToSibling')) {

        const found = parent.childs.find(w => w.index === targetIndex);
        if (found) {
          // JUMP TO SIBLING
          node.context.next = found;
          break;
        } else {
          // JUMP TO PARENT
          targetIndex = parent.index + 1;
          parent = parent.parent;
          continue;
        }
      }
      else if (parent.blockAutoJumpToParent) {
        // JUMP TO PARENT DISABLED
        // SIBLING ENABLED
        const found = parent.childs.find(w => w.index === targetIndex);
        if (found) node.context.next = found;
        break;
      }
      else if (!parent.blockAutoJumpToParent) {
        // JUMP TO PARENT ENABLED
        // SIBLING DISABLED
        targetIndex = parent.index + 1;
        parent = parent.parent;
        continue;
      }
    }
  }
}