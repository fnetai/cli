# 🌳 Flownet Tree Logging Guide

## 📖 Overview

This guide explains how to use the tree logging feature to understand Flownet's node tree construction and next block resolution algorithm (the "karınca yürüyüşü" - ant walk).

## 🚀 Quick Start

### Enable Tree Logging

```bash
FNET_LOG_CATEGORIES=tree fnet build
```

### Enable Multiple Categories

```bash
FNET_LOG_CATEGORIES=tree,bpmn fnet build
```

### Set Log Level

```bash
FNET_LOG_LEVEL=debug FNET_LOG_CATEGORIES=tree fnet build
```

## 📊 What You'll See

### 1. Tree Construction

```
03:42:30.954 info [tree] 🌳 Creating root node
03:42:30.954 info [tree]   📦 Creating workflow: main
03:42:30.954 info [tree]   📦 Creating subworkflow: validate-user-input
03:42:30.954 info [tree]   🔧 Initializing node: main
03:42:30.955 info [tree]       ├─ call: validate-input
03:42:30.955 info [tree]       ├─ assign: prepare-data
03:42:30.956 info [tree]       ├─ if: check-validity
03:42:30.956 info [tree]           ├─ call: process-valid
03:42:30.956 info [tree]         ├─ steps: v::data.isValid
03:42:30.956 info [tree]           ├─ assign: handle-invalid
03:42:30.956 info [tree]         ├─ steps: default
```

### 2. Next Block Resolution (Karınca Yürüyüşü)

#### Auto Next (Sibling)

```
03:42:31.302 info [tree]     🐜 AUTO NEXT (karınca yürüyüşü başlıyor...)
      {
  "from": "/main/validate-input"
}
03:42:31.302 info [tree]         1. ✅ SIBLING FOUND: /main/prepare-data
          {
  "nextNode": "/main/prepare-data"
}
03:42:31.302 info [tree]     └─ 🎯 AUTO NEXT RESOLVED: /main/prepare-data
      {
  "steps": 1,
  "nextNode": "/main/prepare-data"
}
```

#### Auto Next (Parent Climb)

```
03:42:31.302 info [tree]     🐜 AUTO NEXT (karınca yürüyüşü başlıyor...)
      {
  "from": "/main/check-validity/v::data.isValid/process-valid"
}
03:42:31.302 info [tree]         1. ⬆️  No sibling, climbing to parent: /main/check-validity
          {
  "targetIndex": 1
}
03:42:31.302 info [tree]         2. ⬆️  Sibling disabled, climbing to parent: /main
03:42:31.302 info [tree]         3. ✅ SIBLING FOUND: /main/call-action-handler
          {
  "nextNode": "/main/call-action-handler"
}
03:42:31.302 info [tree]     └─ 🎯 AUTO NEXT RESOLVED: /main/call-action-handler
      {
  "steps": 3,
  "nextNode": "/main/call-action-handler"
}
```

#### Explicit Next

```
03:42:31.303 info [tree]     🔍 EXPLICIT NEXT: "show-browse-form" (searching...)
      {
  "from": "/app/show-welcome/props_startBrowse"
}
03:42:31.303 info [tree]     └─ ✅ FOUND: /app/show-browse-form
      {
  "nextNode": "/app/show-browse-form"
}
```

## 🐜 The Ant Walk Algorithm (Karınca Yürüyüşü)

### Metaphor

Think of the node tree as a tree, and you're an ant on a branch. To get to another branch, you must follow the proper path:

1. **Look for sibling** (same level)
2. **If no sibling, climb to parent** (go up)
3. **Look for parent's sibling**
4. **Repeat until root**

### Example

```yaml
main:
  steps:
    - step-a: [...]           # index: 0
    - step-b:                 # index: 1
        if:
          condition: v::isValid
          steps:
            - process-valid:  # ← YOU ARE HERE (ant)
                call: something
        else:
          steps:
            - handle-invalid: [...]
    - step-c: [...]           # index: 2
```

**Ant's journey from `process-valid` to next:**

```
1. Am I: process-valid (index: 0, parent: condition-1)
2. Sibling? (index: 1)
   → No, I'm the only child of condition-1
3. Climb to parent: condition-1 (parent: if/switch)
4. Sibling? (index: 1)
   → Yes! default branch exists
   → BUT I can't go there! (yan dal - side branch)
5. Climb to parent: if/switch (index: 1, parent: step-b)
6. Sibling? (index: 2)
   → No, I'm the only child of step-b
7. Climb to parent: step-b (index: 1, parent: main)
8. Sibling? (index: 2)
   → YES! step-c found!
9. Next = step-c ✅
```

**Path:**

```
process-valid → condition-1 (parent) → if/switch (parent) → step-b (parent) → step-c (sibling)
```

## 🎯 Log Symbols

| Symbol | Meaning |
|--------|---------|
| 🌳 | Root node creation |
| 📦 | Workflow/subworkflow creation |
| 🔧 | Node initialization |
| ├─ | Child node |
| └─ | Last child or result |
| 🐜 | Auto next (ant walk) starting |
| 🔍 | Explicit next search |
| ✅ | Success (found) |
| ⚠️  | Warning (not found) |
| ⛔ | Blocked (disabled) |
| ⬆️  | Climbing to parent |
| 🎯 | Final resolution |

## 📁 Implementation Files

### Logger Setup

- `src/builder/logger.js` - Winston logger configuration

### Tree Logging

- `src/builder/wf-builder.js` - Tree construction logging
  - `initNodeTree()` - Root and workflow creation
  - `initNode()` - Block type detection and initialization

### Next Resolution Logging

- `src/builder/block-api/resolve-next-block/index.js` - Next block resolution
  - Auto next (ant walk)
  - Explicit next (search by name)
  - Return/end/stop handling

## 🔍 Understanding BPMN Generation

Now that you can see the tree structure and next resolution, you can understand how BPMN is generated:

### Current Implementation

```javascript
// src/builder/bpmn/index.js
function getBpmnType(node) {
  if (node.type === 'call') return "bpmn:ServiceTask";  // ← Subworkflow calls
  else if (node.type === 'form') return "bpmn:UserTask";
  else if (node.type === 'return') return "bpmn:EndEvent";
  else return "bpmn:Task";
}
```

### Call Activity Opportunity

**Current:** `call` → `bpmn:ServiceTask` (generic task)

**Potential:** `call` → `bpmn:CallActivity` (subprocess reference)

**Benefits:**

- ✅ BPMN spec compliant
- ✅ Link to per-flow BPMN files
- ✅ Better process mining
- ✅ Clearer visualization

## 🎓 Learning Path

1. **Enable tree logging** and build a simple project
2. **Observe tree construction** - How nodes are created
3. **Follow the ant walk** - How next blocks are resolved
4. **Understand branching** - How if/switch creates child nodes
5. **Study BPMN generation** - How tree maps to BPMN elements
6. **Experiment with Call Activity** - Improve BPMN representation

## 💡 Tips

### Focus on Specific Flows

```bash
# Build and grep for specific flow
FNET_LOG_CATEGORIES=tree fnet build 2>&1 | grep "main"
```

### Save Logs for Analysis

```bash
FNET_LOG_CATEGORIES=tree fnet build > tree.log 2>&1
```

### Compare Before/After

```bash
# Before changes
FNET_LOG_CATEGORIES=tree fnet build > before.log 2>&1

# Make changes to flows.yaml

# After changes
FNET_LOG_CATEGORIES=tree fnet build > after.log 2>&1

# Compare
diff before.log after.log
```

## 🚀 Next Steps

1. **Add BPMN logging** - Track BPMN element creation
2. **Implement Call Activity** - Replace ServiceTask for subworkflow calls
3. **Link per-flow BPMN** - Reference individual BPMN files
4. **Enhance visualization** - Better BPMN diagrams

## 📚 Related Documentation

- `knowledge/flownet/facts/fnet-flow-bpmn-per-flow-files.md` - Per-flow BPMN files
- `knowledge/flownet/articles/flownet-low-level-flow-framework.md` - Flownet philosophy
- `examples/bpmn-improvement/README.md` - Example project

---

**Remember:** The tree logging is your window into Flownet's internal workings. Use it to understand, debug, and improve the framework! 🌳🐜
