import BpmnModdle from 'bpmn-moddle';
import dagre from 'dagre';
import cloneDeep from 'lodash.clonedeep';
import atomJson from './atom.json' with { type: 'json' };
import { bpmnLogger, isLogEnabled } from '../logger.js';

function initNodes(context) {
  const { nodes, nodeIndex, root } = context;

  // First pass: collect inline end events (only once for all nodes)
  const inlineEndEvents = [];
  const processedNodes = new Set();

  const collectInlineEndEvents = (tempNode) => {
    // Skip if already processed
    if (processedNodes.has(tempNode.indexKey)) return;
    processedNodes.add(tempNode.indexKey);

    // Check for inline return (hasReturn flag on non-return nodes)
    if (tempNode.hasReturn && tempNode.type !== 'return') {
      const inlineEndEventKey = `${tempNode.indexKey}/_inline_end`;

      // Check if inline end event already exists (from previous initNodes call)
      if (nodeIndex[inlineEndEventKey]) {
        // Already created, skip
        return;
      }

      // Create inline end event (virtual node)
      const inlineEndEvent = {
        name: '',  // Nameless inline end event
        type: 'return',
        virtual: true,
        parent: tempNode.parent,
        childs: [],
        definition: { return: tempNode.definition.return },
        index: tempNode.parent.childs.length,
        indexKey: inlineEndEventKey,
        pathKey: `${tempNode.pathKey}._inline_end`,
        codeKey: `${tempNode.codeKey}_inline_end`,
        context: { next: null },  // No next for end events
        hasReturn: true,
        _inlineParent: tempNode  // Store reference to parent node
      };

      inlineEndEvents.push(inlineEndEvent);

      if (isLogEnabled('bpmn')) bpmnLogger.info(`  🏁 INLINE RETURN → EndEvent: ${inlineEndEvent.indexKey} (parent: ${tempNode.indexKey})`);
    }

    tempNode.childs.forEach(child => collectInlineEndEvents(child));
  };

  // Collect from all nodes (only once)
  nodes.forEach(node => collectInlineEndEvents(node));

  // Add inline end events to nodes array and nodeIndex
  inlineEndEvents.forEach(inlineEndEvent => {
    inlineEndEvent.parent.childs.push(inlineEndEvent);
    nodeIndex[inlineEndEvent.indexKey] = inlineEndEvent;
    nodes.push(inlineEndEvent);
  });

  // Second pass: create edges
  nodes.forEach(node => {

    const all = [];
    const start = [];

    const iterate = (tempNode) => {

      // Check if this node has an inline end event
      const hasInlineEndEvent = inlineEndEvents.find(e => e._inlineParent === tempNode);

      if (hasInlineEndEvent) {
        // Create edge from tempNode to inline end event
        all.push({
          from: tempNode,
          to: hasInlineEndEvent,
          type: "bpmn:SequenceFlow",
        });

        // Don't process next for nodes with inline return
        // (they terminate at the inline end event)
      }
      else if (tempNode.context.next) {
        all.push({
          from: tempNode,
          to: tempNode.context.next,
          type: "bpmn:SequenceFlow",
        });

        // TODO: TEMP
        if (tempNode === node) {
          start.push({
            to: tempNode.context.next,
            type: "bpmn:SequenceFlow",
            next: true
          });
        }
      }
      tempNode.childs.forEach(tempNodeChild => {

        // TODO: TEMP
        if (tempNode === node) {
          if (node.type === 'switch') {
            // Don't create edge to inline end events from switch
            // (inline end events only accept edges from their parent)
            const isInlineEndEvent = tempNodeChild.indexKey && tempNodeChild.indexKey.endsWith('/_inline_end');
            if (!isInlineEndEvent) {
              start.push({
                to: tempNodeChild,
                type: "bpmn:SequenceFlow",
              });
            }
          }
        }

        iterate(tempNodeChild);
      });
    };

    iterate(node);

    const edges = all
      .filter(w => w.to.parent.indexKey === node.parent.indexKey)
      .map(item => { return { ...item, from: node.indexKey, to: item.to.indexKey } });

    const outside = all
      .filter(w => (w.to.parent.indexKey !== node.parent.indexKey) && !w.to.indexKey.startsWith(node.indexKey + '/'))
      .map(item => { return { ...item, from: node.indexKey, to: item.to.indexKey } });

    // TODO: TEMP
    const starts = start
      .map(item => { return { ...item, to: item.to.indexKey } });

    node.bpmn = node.bpmn || {};
    node.bpmn.edges = removeDuplicates(edges, "to");
    node.bpmn.outside = removeDuplicates(outside, "to");
    node.bpmn.starts = removeDuplicates(starts, "to");
    node.bpmn.type = getBpmnType(node);
    node.bpmn.width = 120;
    node.bpmn.height = 80;

    // Special styling for different node types
    if (node.type === 'return') {
      node.bpmn.width = 36;
      node.bpmn.height = 36;
    }

    // CallActivity (subworkflow chip) - Special color!
    if (node.bpmn.type === 'bpmn:CallActivity') {
      node.bpmn.fill = "#E1F5FE";    // Light blue background
      node.bpmn.stroke = "#0277BD";  // Dark blue border
    }
  });
}

function getBpmnType(node) {
  let bpmnType;

  if (node.type === 'call') {
    // Check if calling a subworkflow (internal) or external function
    const isSubworkflow = node.context?.lib?.type === 'subworkflow' ||
                          node.context?.lib?.type === 'workflow';

    if (isSubworkflow) {
      bpmnType = "bpmn:CallActivity";  // ← Subworkflow = CallActivity (chip!)
      if (isLogEnabled('bpmn')) bpmnLogger.info(`  📦 CALL → CallActivity (subworkflow): ${node.indexKey} (${node.context?.lib?.name || 'unknown'})`);
    } else {
      bpmnType = "bpmn:ServiceTask";  // ← External function = ServiceTask
      if (isLogEnabled('bpmn')) bpmnLogger.info(`  📞 CALL → ServiceTask (external): ${node.indexKey} (${node.context?.lib?.name || 'unknown'})`);
    }
  }
  else if (node.type === 'form') {
    bpmnType = "bpmn:UserTask";
    if (isLogEnabled('bpmn')) bpmnLogger.info(`  📝 FORM → UserTask: ${node.indexKey}`);
  }
  else if (node.type === 'return') {
    bpmnType = "bpmn:EndEvent";
    if (isLogEnabled('bpmn')) bpmnLogger.info(`  🏁 RETURN → EndEvent: ${node.indexKey}`);
  }
  else if (node.type === 'raise') {
    // Context-aware mapping: IntermediateThrowEvent inside try, EndEvent outside
    // Check if this node itself is named 'try' (single-step try block) or any ancestor is a 'try' block
    let isInsideTry = false;

    // Check if this node itself is the try block (single-step try block)
    if (node.name === 'try' && node.parent?.type === 'tryexcept') {
      isInsideTry = true;
    } else {
      // Check ancestors
      let current = node.parent;
      while (current) {
        if (current.name === 'try' && current.parent?.type === 'tryexcept') {
          isInsideTry = true;
          break;
        }
        current = current.parent;
      }
    }

    if (isInsideTry) {
      bpmnType = "bpmn:IntermediateThrowEvent";  // ← Inside try block
      if (isLogEnabled('bpmn')) bpmnLogger.info(`  ⚡ RAISE → IntermediateThrowEvent (inside try): ${node.indexKey}`);
    } else {
      bpmnType = "bpmn:EndEvent";  // ← Outside try block
      if (isLogEnabled('bpmn')) bpmnLogger.info(`  ⚠️ RAISE → EndEvent (error): ${node.indexKey}`);
    }
  }
  else if (node.type === 'pipeline') {
    bpmnType = "bpmn:ServiceTask";
    if (isLogEnabled('bpmn')) bpmnLogger.info(`  🔧 PIPELINE → ServiceTask (external binary): ${node.indexKey} (${node.context?.binaryName || 'unknown'})`);
  }
  else if (node.type === 'http') {
    bpmnType = "bpmn:ServiceTask";
    if (isLogEnabled('bpmn')) bpmnLogger.info(`  🌐 HTTP → ServiceTask (external API): ${node.indexKey} (${node.context?.http?.method || 'GET'} ${node.context?.http?.url || 'unknown'})`);
  }
  else if (node.type === 'assign' || node.type === 'new') {
    bpmnType = "bpmn:ScriptTask";
    if (isLogEnabled('bpmn')) bpmnLogger.info(`  📜 ${node.type.toUpperCase()} → ScriptTask: ${node.indexKey}`);
  }
  else {
    bpmnType = "bpmn:Task";
    if (isLogEnabled('bpmn')) bpmnLogger.info(`  📋 ${node.type.toUpperCase()} → Task: ${node.indexKey}`);
  }

  return bpmnType;
}

function removeDuplicates(array, criteria) {
  return array.filter((obj, pos, arr) => {
    return arr.map(mapObj => mapObj[criteria]).indexOf(obj[criteria]) === pos;
  });
}

function createVirtualNodes(context) {
  const { nodes, nodeIndex, root } = context;

  const targetNodes = context.targetNodes || root.childs;

  targetNodes.forEach(node => {

    const isProcess = node.type === 'workflow' || node.type === 'subworkflow';

    const isSubProcess = !isProcess
      && node.childs.filter(w => !w.virtual).length > 0
      ;

    // Force try/except blocks to be SubProcess (even if they have no children)
    const isTryExceptBlock = (node.name === 'try' || node.name === 'except')
      && node.parent?.type === 'tryexcept';

    // Force schedule blocks to be SubProcess (container for timer event)
    const isScheduleBlock = node.type === 'schedule';

    // Force retry blocks to be SubProcess (container for retry logic)
    const isRetryBlock = node.type === 'retry';

    if (isSubProcess || isTryExceptBlock || isScheduleBlock || isRetryBlock) {
      node.bpmn.type = "bpmn:SubProcess";

      // Add loop marker for 'for' step type
      if (node.type === 'for') {
        node.bpmn.loopCharacteristics = true;  // Will be converted to StandardLoopCharacteristics
        if (isLogEnabled('bpmn')) bpmnLogger.info(`  🔁 FOR → SubProcess + Loop Marker: ${node.indexKey}`);
      }

      // If try block contains only a raise step (single-step try block),
      // create a virtual IntermediateThrowEvent inside the SubProcess
      if (node.name === 'try' && node.type === 'raise' && node.parent?.type === 'tryexcept') {
        const vNode = createVirtualNode({
          location: 0,
          ...context,
          parent: node,
          bpmnType: "bpmn:IntermediateThrowEvent",
          type: "raise",
          attrs: {},
          definitions: [{ type: "bpmn:ErrorEventDefinition" }]
        });

        if (isLogEnabled('bpmn')) bpmnLogger.info(`  ⚡ Created virtual IntermediateThrowEvent for single-step try block: ${node.indexKey}`);
      }
    }

    if (isProcess || isSubProcess) {

      // Find first node (excluding modules and inline end events)
      const firstNode = node.childs.filter(w =>
        w.module !== true &&
        !w.indexKey.endsWith('/_inline_end')
      )[0];

      // Modules intermediate catch event
      const childModules = node.childs.filter(w => w.module === true);
      childModules.forEach(moduleNode => {
        const vNode = createVirtualNode({ ...context, parent: node, bpmnType: "bpmn:IntermediateCatchEvent", type: "inter", definitions: [{ type: "bpmn:SignalEventDefinition" }] });
        vNode.bpmn.edges = [{ from: vNode.indexKey, to: moduleNode.indexKey, type: "bpmn:SequenceFlow" }];
      });

      // tryNode
      const tryNode = node.childs.find(w => w.name === "try" && node.type === 'tryexcept');
      const exceptNodes = node.childs.filter(w => w.name === "except" && node.type === 'tryexcept');
      if (tryNode && exceptNodes.length) {
        // Except nodes
        exceptNodes.forEach(exceptNode => {
          const vNode = createVirtualNode({ location: node.childs.indexOf(exceptNode), ...context, parent: node, bpmnType: "bpmn:BoundaryEvent", type: "boundary", attrs: { attachedToRef: tryNode }, definitions: [{ type: "bpmn:ErrorEventDefinition" }] });
          vNode.bpmn.edges = [{ from: vNode.indexKey, to: exceptNode.indexKey, type: "bpmn:SequenceFlow" }];

          if (isLogEnabled('bpmn')) bpmnLogger.info(`  ⚡ TRY-EXCEPT → BoundaryEvent: ${node.indexKey} (try: ${tryNode.indexKey}, except: ${exceptNode.indexKey})`);
        });
      }

      // raiseNode
      const raiseNode = node.childs.find(w => w.type === "raise");
      if (raiseNode) {
        const vEndNode = createVirtualNode({ ...context, parent: node, bpmnType: "bpmn:EndEvent", type: "end", name: `ERROR`, definitions: [{ type: "bpmn:ErrorEventDefinition" }] });
        raiseNode.bpmn.edges = [{ from: raiseNode.indexKey, to: vEndNode.indexKey, type: "bpmn:SequenceFlow" }];
      }

      // scheduleNode - create virtual timer event
      if (node.type === 'schedule') {
        const scheduledChild = node.childs[0]; // Schedule has exactly one child
        if (scheduledChild) {
          // Create virtual StartEvent with TimerEventDefinition
          const vStartNode = createVirtualNode({
            ...context,
            parent: node,
            bpmnType: "bpmn:StartEvent",
            type: "timer-start",
            definitions: [{
              type: "bpmn:TimerEventDefinition",
              timerType: "timeCycle",
              expression: node.context?.cron || '* * * * *'
            }]
          });

          // Connect timer start to child
          vStartNode.bpmn.edges = [{ from: vStartNode.indexKey, to: scheduledChild.indexKey, type: "bpmn:SequenceFlow" }];

          if (isLogEnabled('bpmn')) bpmnLogger.info(`  ⏰ SCHEDULE → SubProcess + TimerStartEvent: ${node.indexKey} (cron: ${node.context?.cron})`);
        }
      }

      if (firstNode) {
        // Special handling for schedule step type - skip normal start event (timer start already created)
        if (node.type === 'schedule') {
          // Timer StartEvent already created above, no need for normal StartEvent
          if (isLogEnabled('bpmn')) bpmnLogger.info(`  ⏰ SCHEDULE → Skipping normal StartEvent (using TimerStartEvent): ${node.indexKey}`);
        }
        // Special handling for retry step type - use normal start with loop characteristics
        else if (node.type === 'retry') {
          // Retry uses normal StartEvent but SubProcess has loop characteristics
          const vStartNode = createVirtualNode({ ...context, parent: node, bpmnType: "bpmn:StartEvent", type: "start" });
          vStartNode.bpmn.edges.push({ from: vStartNode.indexKey, to: firstNode.indexKey, type: "bpmn:SequenceFlow" });

          if (isLogEnabled('bpmn')) bpmnLogger.info(`  🔁 RETRY → SubProcess with loop characteristics: ${node.indexKey} (attempts: ${node.context?.attempts})`);
        }
        // Special handling for parallel step type
        else if (node.type === 'parallel') {
          const vStartNode = createVirtualNode({ ...context, parent: node, bpmnType: "bpmn:StartEvent", type: "start" });
          const vForkNode = createVirtualNode({ ...context, parent: node, bpmnType: "bpmn:ParallelGateway", type: "fork" });
          const vJoinNode = createVirtualNode({ ...context, parent: node, bpmnType: "bpmn:ParallelGateway", type: "join" });
          const vEndNode = createVirtualNode({ ...context, parent: node, bpmnType: "bpmn:EndEvent", type: "end" });

          // Start → Fork
          vStartNode.bpmn.edges = [{ from: vStartNode.indexKey, to: vForkNode.indexKey, type: "bpmn:SequenceFlow" }];

          // Fork → All children
          const parallelChildren = node.childs.filter(w => !w.virtual && !w.module && !w.indexKey.endsWith('/_inline_end'));
          vForkNode.bpmn.edges = parallelChildren.map(child => {
            return { from: vForkNode.indexKey, to: child.indexKey, type: "bpmn:SequenceFlow" };
          });

          // All children → Join
          parallelChildren.forEach(child => {
            child.bpmn.edges = [{ from: child.indexKey, to: vJoinNode.indexKey, type: "bpmn:SequenceFlow" }];
          });

          // Join → End
          vJoinNode.bpmn.edges = [{ from: vJoinNode.indexKey, to: vEndNode.indexKey, type: "bpmn:SequenceFlow" }];

          if (isLogEnabled('bpmn')) bpmnLogger.info(`  🔀 PARALLEL → Fork/Join Gateways: ${node.indexKey} (${parallelChildren.length} children)`);
        }
        else if (node.bpmn.starts.length > 1) {

          const vStartNode = createVirtualNode({ ...context, parent: node, bpmnType: "bpmn:StartEvent", type: "start" });
          const vSwitchNode = createVirtualNode({ ...context, parent: node, bpmnType: "bpmn:ExclusiveGateway", type: "switch" });
          vStartNode.bpmn.edges = [{ from: vStartNode.indexKey, to: vSwitchNode.indexKey, type: "bpmn:SequenceFlow" }];
          vSwitchNode.bpmn.edges = node.bpmn.starts.map(m => { return { ...m, from: vSwitchNode.indexKey } });

          const nextNode = vSwitchNode.bpmn.edges.find(w => w.next === true);

          if (nextNode) {
            const vEndNode = createVirtualNode({ ...context, parent: node, bpmnType: "bpmn:EndEvent", type: "end", name: nextNode.to });
            nextNode.to = vEndNode.indexKey;
          }
        }
        else {
          const vStartNode = createVirtualNode({ ...context, parent: node, bpmnType: "bpmn:StartEvent", type: "start" });
          vStartNode.bpmn.edges.push({ from: vStartNode.indexKey, to: firstNode.indexKey, type: "bpmn:SequenceFlow" });
        }
      }
      else {
        // No firstNode found (only modules or inline end events)
        // Don't create start event - it has nowhere to go!
        if (isLogEnabled('bpmn')) bpmnLogger.info(`  🚫 START EVENT skipped (no valid firstNode): ${node.indexKey}`);
      }

      const outsideNodes = node.childs.filter(w =>
        w.virtual !== true &&
        w.bpmn.outside.length &&
        w.bpmn.type !== 'bpmn:EndEvent'
      );

      outsideNodes.forEach(noEndNode => {
        noEndNode.bpmn.outside.forEach(out => {
          const location = targetNodes.indexOf(node);
          const vEndNode = createVirtualNode({ ...context, parent: node, bpmnType: "bpmn:EndEvent", type: "end", name: out.to, location: location + 1 });

          noEndNode.bpmn.edges.push({ from: noEndNode.indexKey, to: vEndNode.indexKey, type: "bpmn:SequenceFlow" });
        })
      });

      const switchRequiredNodes = node.childs.filter(w =>
        w.virtual !== true &&
        w.bpmn.edges.length > 1
      );

      // add virtual switch node
      switchRequiredNodes.forEach(switchRequiredNode => {

        const location = targetNodes.indexOf(switchRequiredNode);

        const vSwitchNode = createVirtualNode({ ...context, parent: node, bpmnType: "bpmn:ExclusiveGateway", type: "switch", location: location + 1 });

        vSwitchNode.bpmn.edges = switchRequiredNode.bpmn.edges.map(m => { return { ...m, from: vSwitchNode.indexKey } });

        switchRequiredNode.bpmn.edges = [{ from: switchRequiredNode.indexKey, to: vSwitchNode.indexKey, type: "bpmn:SequenceFlow" }];
        switchRequiredNode.bpmn.outside = [];
      });
    }
    createVirtualNodes({ ...context, targetNodes: node.childs });
  });
}

function createVirtualNode(context) {
  const { parent, nodes, nodeIndex, bpmnType, type, name, outside, location, definitions, attrs } = context;

  const index = parent.childs.filter(w => w.type === `v${type}`).length;

  if (isLogEnabled('bpmn')) bpmnLogger.info(`    🔷 VIRTUAL ${type.toUpperCase()} → ${bpmnType}: ${parent.indexKey}/_${type}${index}`);

  const virtualNode = {
    indexKey: `${parent.indexKey}/_${type}${index}`,
    pathKey: `${parent.pathKey}._${type}${index}`,
    type: `v${type}`,
    name: name,
    bpmn: {
      edges: [],
      outside: [],
      type: bpmnType,
      width: 36,
      height: 36,
      fill: "#c8e6c9",
      stroke: "#205022",
      definitions,
      attrs
    },
    virtual: true,
    childs: []
  }

  parent.childs.splice(location || 0, 0, virtualNode);
  nodes.push(virtualNode);
  nodeIndex[virtualNode.indexKey] = virtualNode;

  return virtualNode;
}

function create(context) {

  const { targetNode, targetFlowElementsContainer, targetPlaneElement, moddle, elementIndex, nodeIndex, diagrams, nodes } = context;

  createFlowNodes(context);

  createSequenceFlows(context);

  createDiagram(context);

  createSubprocesses(context);
}

function createFlowNodes(context) {
  const { targetNode, targetFlowElementsContainer, targetPlaneElement, moddle, elementIndex, nodeIndex, nodes } = context;
  const flowElements = targetFlowElementsContainer.get('flowElements');
  targetFlowElementsContainer.$nodes = targetFlowElementsContainer.$nodes || [];

  if (isLogEnabled('bpmn')) bpmnLogger.info(`🎨 Creating BPMN elements for: ${targetNode.indexKey} (${targetNode.childs.length} children)`);

  // create flow nodes
  targetNode.childs.forEach(child => {

    const flowElement = moddle.create(child.bpmn.type, { id: `node.${child.pathKey}`, name: child.definition?.title || child.name });
    elementIndex[flowElement.id] = flowElement;
    flowElement.$isNode = true;
    flowElement.$node = child;
    child.$flow = flowElement;
    targetFlowElementsContainer.$nodes.push(flowElement);
    flowElements.push(flowElement);

    // Add calledElement for CallActivity (subworkflow chip!)
    if (child.bpmn.type === 'bpmn:CallActivity' && child.context?.lib) {
      flowElement.calledElement = child.context.lib.name;
      if (isLogEnabled('bpmn')) bpmnLogger.info(`  ✨ Created: ${child.bpmn.type} (chip!): ${flowElement.id} → ${flowElement.calledElement}`);
    } else if (isLogEnabled('bpmn')) {
      bpmnLogger.info(`  ✨ Created: ${child.bpmn.type}: ${flowElement.id}${child.virtual ? ' (virtual)' : ''}`);
    }

    if (child.bpmn.attrs) {
      const attrKeys = Object.keys(child.bpmn.attrs);
      attrKeys.forEach(attrKey => {
        if (attrKey === 'attachedToRef')
          flowElement.set(attrKey, child.bpmn.attrs[attrKey].$flow);
      });
    }

    if (child.bpmn.definitions) {
      const definitons = child.bpmn.definitions.map(m => {
        const temp = moddle.create(m.type);
        const attrKeys = Object.keys(m.attrs || {});
        attrKeys.forEach(attrKey => {
          temp.set(attrKey, m.attrs[attrKey]);
        });
        return temp;
      });
      flowElement.eventDefinitions = definitons;
    }

    // Add loop characteristics for 'for' step type
    if (child.bpmn.loopCharacteristics && child.bpmn.type === 'bpmn:SubProcess') {
      flowElement.loopCharacteristics = moddle.create('bpmn:StandardLoopCharacteristics');
      if (isLogEnabled('bpmn')) bpmnLogger.info(`  🔁 Added loop marker to: ${flowElement.id} (${child.type})`);
    }
  });
}

function createSequenceFlows(context) {
  const { targetNode, targetFlowElementsContainer, targetPlaneElement, moddle, elementIndex, nodeIndex } = context;
  const flowElements = targetFlowElementsContainer.get('flowElements');
  targetFlowElementsContainer.$edges = targetFlowElementsContainer.$edges || [];

  // create sequence flows
  targetNode.childs.forEach(child => {

    const edges = child.bpmn.edges;

    edges.forEach(edge => {

      const fromNode = child;
      const toNode = nodeIndex[edge.to];
      const id = `edge.${fromNode.pathKey}_${toNode.pathKey}`;
      if (elementIndex[id]) return;

      const sourceRef = elementIndex[`node.${fromNode.pathKey}`];
      const targetRef = elementIndex[`node.${toNode.pathKey}`];

      const flowElement = moddle.create(edge.type, { id, sourceRef, targetRef });
      elementIndex[flowElement.id] = flowElement;
      flowElement.$is_edge = true;

      sourceRef.get('outgoing').push(flowElement);
      targetRef.get('incoming').push(flowElement);

      targetFlowElementsContainer.$edges.push({ from: sourceRef, to: targetRef, flow: flowElement });
      flowElements.push(flowElement);
    });
  });
}

function createDiagram(context) {
  const { targetNode, targetFlowElementsContainer, targetPlaneElement, moddle, elementIndex, nodeIndex } = context;

  // create diagram
  const nodeSep = 120;
  const rankSep = 80;

  const xOffset = 160;
  const yOffset = 160;

  // layout engine
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // The rankdir option can take one of the following values:

  // TB: Top-to-bottom layout. This is the default value.
  // BT: Bottom-to-top layout.
  // LR: Left-to-right layout.
  // RL: Right-to-left layout.

  dagreGraph.setGraph({ rankdir: "TB", nodesep: nodeSep, ranksep: rankSep, xranker: "longest-path" });

  targetFlowElementsContainer.$nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.$node?.bpmn.width || nodeSep,
      height: node.$node?.bpmn.height || rankSep,
      label: node.id
    });
  });

  targetFlowElementsContainer.$edges.forEach((edge) => {
    dagreGraph.setEdge(edge.from.id, edge.to.id);
  });

  dagre.layout(dagreGraph);

  targetFlowElementsContainer.$nodes.forEach((node) => {
    const layout = dagreGraph.node(node.id);

    let width = layout.width;
    let height = layout.height;

    const shape = moddle.create("bpmndi:BPMNShape", {
      id: `shape.${node.id}`,
      bpmnElement: node,
      bounds: moddle.create("dc:Bounds", {
        x: xOffset + layout.x - layout.width / 2,
        y: yOffset + layout.y - layout.height / 2,
        width: width,
        height: height
      }),
      label: moddle.create('bpmndi:BPMNLabel')
    });

    if (node.$node.bpmn.fill) shape.set('bioc:fill', node.$node.bpmn.fill);
    if (node.$node.bpmn.stroke) shape.set('bioc:stroke', node.$node.bpmn.stroke);

    const planeElement = targetPlaneElement.get('planeElement');
    planeElement.push(shape);
  });

  targetFlowElementsContainer.$edges.forEach((edge) => {
    const layout = dagreGraph.edge(edge.from.id, edge.to.id);

    const shape = moddle.create("bpmndi:BPMNEdge", {
      id: `edge.${edge.from.id}_${edge.to.id}`,
      bpmnElement: edge.flow,
      label: moddle.create('bpmndi:BPMNLabel')
    });

    layout.points.forEach(point => {

      const waypoint = moddle.create("dc:Point", {
        x: xOffset + point.x,
        y: yOffset + point.y
      });

      shape.get('waypoint').push(waypoint);
    });

    const planeElement = targetPlaneElement.get('planeElement');
    planeElement.push(shape);
  });
}

function createSubprocesses(context) {
  const { targetNode, targetFlowElementsContainer, targetPlaneElement, moddle, elementIndex, nodeIndex, diagrams } = context;

  const subprocessNodes = targetNode.childs.filter(w => w.bpmn.type === 'bpmn:SubProcess');

  subprocessNodes.forEach(subprocessNode => {

    const subprocessElement = elementIndex[`node.${subprocessNode.pathKey}`];
    const diagramElement = moddle.create('bpmndi:BPMNDiagram', { id: `diagram_${subprocessNode.pathKey}` });
    elementIndex[diagramElement.id] = diagramElement;
    diagrams.push(diagramElement);

    // PLANE
    const planeElement = moddle.create('bpmndi:BPMNPlane', { id: `plane_${subprocessNode.pathKey}` });
    elementIndex[planeElement.id] = planeElement;

    diagramElement.plane = planeElement;
    planeElement.bpmnElement = subprocessElement;

    create({ ...context, targetNode: subprocessNode, targetFlowElementsContainer: subprocessElement, targetPlaneElement: planeElement });
  });
}

async function modelA(context) {

  const root = context.root;

  const nodeIndex = root.context.index;
  const nodes = Object.keys(nodeIndex).map(key => nodeIndex[key]);

  initNodes({ nodes, nodeIndex, root });

  createVirtualNodes({ nodes, nodeIndex, root });

  // const defaultDiagram = await loadBpmnFile('default');
  const defaultDiagram = undefined;
  // const result = await moddle.fromXML(defaultDiagram);

  const moddle = new BpmnModdle({
    atom: atomJson
  });

  const elementIndex = {};

  // BASE
  // Definitions
  const definitions = moddle.create('bpmn:Definitions', { id: "definitions_0" });
  elementIndex[definitions.id] = definitions;

  for await (const flow of root.childs) {

    const rootElements = definitions.get('rootElements');
    const diagrams = definitions.get('diagrams');

    // PROCESS
    const process = moddle.create('bpmn:Process', {
      id: `process_${flow.pathKey}`,
      name: flow.name,
      documentation: [moddle.create('bpmn:Documentation', { text: `Workflow - ${flow.name}` })],
    });
    elementIndex[process.id] = process;

    process.isExecutable = true;
    rootElements.push(process);

    // DIAGRAM
    const diagram = moddle.create('bpmndi:BPMNDiagram', { id: `diagram_${flow.pathKey}` });
    elementIndex[diagram.id] = diagram;
    diagrams.push(diagram);

    // PLANE
    const plane = moddle.create('bpmndi:BPMNPlane', { id: `plane_${flow.pathKey}` });
    elementIndex[plane.id] = plane;

    diagram.plane = plane;
    plane.bpmnElement = process;

    // workflow or subworkflow
    const targetNode = flow;
    const targetFlowElementsContainer = process;
    const targetPlaneElement = plane;

    create({ targetNode, targetFlowElementsContainer, targetPlaneElement, moddle, elementIndex, nodeIndex, nodes, diagrams });
  }

  const moddleResult = await moddle.toXML(definitions, { format: true });

  return {
    diagramXML: defaultDiagram || moddleResult.xml
  }
}

/**
 * Generate BPMN model for a single flow
 * @param {Object} context - Context with root and flowName
 * @returns {Promise<Object>} Object with diagramXML
 */
async function generateBpmnModelForSingleFlow(context) {
  const { root, flowName } = context;

  // Clone the root to avoid modifying the original
  const clonedRoot = cloneDeep(root);

  // Filter to only include the specific flow
  const flow = clonedRoot.childs.find(f => f.name === flowName);

  if (!flow) {
    throw new Error(`Flow "${flowName}" not found`);
  }

  // Create a new root with only this flow
  const singleFlowRoot = {
    ...clonedRoot,
    childs: [flow]
  };

  const nodeIndex = singleFlowRoot.context.index;
  const nodes = Object.keys(nodeIndex).map(key => nodeIndex[key]);

  initNodes({ nodes, nodeIndex, root: singleFlowRoot });
  createVirtualNodes({ nodes, nodeIndex, root: singleFlowRoot });

  const moddle = new BpmnModdle({
    atom: atomJson
  });

  const elementIndex = {};

  // BASE - Definitions
  const definitions = moddle.create('bpmn:Definitions', { id: `definitions_${flowName}` });
  elementIndex[definitions.id] = definitions;

  const rootElements = definitions.get('rootElements');
  const diagrams = definitions.get('diagrams');

  // PROCESS
  const process = moddle.create('bpmn:Process', {
    id: `process_${flow.pathKey}`,
    name: flow.name,
    documentation: [moddle.create('bpmn:Documentation', { text: `Workflow - ${flow.name}` })],
  });
  elementIndex[process.id] = process;

  process.isExecutable = true;
  rootElements.push(process);

  // DIAGRAM
  const diagram = moddle.create('bpmndi:BPMNDiagram', { id: `diagram_${flow.pathKey}` });
  elementIndex[diagram.id] = diagram;
  diagrams.push(diagram);

  // PLANE
  const plane = moddle.create('bpmndi:BPMNPlane', { id: `plane_${flow.pathKey}` });
  elementIndex[plane.id] = plane;

  diagram.plane = plane;
  plane.bpmnElement = process;

  // workflow or subworkflow
  const targetNode = flow;
  const targetFlowElementsContainer = process;
  const targetPlaneElement = plane;

  create({ targetNode, targetFlowElementsContainer, targetPlaneElement, moddle, elementIndex, nodeIndex, nodes, diagrams });

  const moddleResult = await moddle.toXML(definitions, { format: true });

  return {
    diagramXML: moddleResult.xml,
    flowName: flow.name
  }
}

/**
 * Generate BPMN model for all flows (full engine)
 * @param {Object} context - Context with root
 * @returns {Promise<Object>} Object with diagramXML
 */
export default async function generateBpmnModel(context = {}) {
  return await modelA(cloneDeep(context));
}

/**
 * Generate BPMN models for each flow separately
 * @param {Object} context - Context with root
 * @returns {Promise<Array>} Array of objects with diagramXML and flowName
 */
export async function generateBpmnModelsPerFlow(context = {}) {
  const clonedContext = cloneDeep(context);
  const { root } = clonedContext;

  const results = [];

  for (const flow of root.childs) {
    const result = await generateBpmnModelForSingleFlow({ root, flowName: flow.name });
    results.push(result);
  }

  return results;
}