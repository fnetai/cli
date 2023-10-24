const chalk = require("chalk");

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
        // AUTO FINDING NEXT BLOCK
        let parent = node.parent;
        let targetIndex = node.index + 1;

        while (parent.parent) {

            // NEITHER JUMP TO PARENT NOR SIBLING ENABLED
            if (parent.blockAutoJumpToParent && parent.blockAutoJumpToSibling)
                break;

            if (parent.blockAutoJumpToParent) {
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