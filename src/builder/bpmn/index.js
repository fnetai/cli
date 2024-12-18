const BpmnModdle = require('bpmn-moddle');
const dagre = require('dagre');
const cloneDeep = require('lodash.clonedeep');
const atomJson = require('./atom.json');

function initNodes(context) {
    const { nodes, nodeIndex, root } = context;

    nodes.forEach(node => {

        const all = [];
        const start = [];

        const iterate = (tempNode) => {

            if (tempNode.context.next) {
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
                        start.push({
                            to: tempNodeChild,
                            type: "bpmn:SequenceFlow",
                        });
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

        // testing
        if (node.type === 'return') {
            node.bpmn.width = 36;
            node.bpmn.height = 36;
        }
    });
}

function getBpmnType(node) {
    if (node.type === 'call') return "bpmn:ServiceTask";
    else if (node.type === 'form') return "bpmn:UserTask";
    else if (node.type === 'return') return "bpmn:EndEvent";
    else return "bpmn:Task";
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

        if (isSubProcess) {
            node.bpmn.type = "bpmn:SubProcess";
        }

        if (isProcess || isSubProcess) {

            const firstNode = node.childs.filter(w=>w.module!==true)[0];

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
                });
            }

            if (firstNode) {
                if (node.bpmn.starts.length > 1) {

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

    // create flow nodes
    targetNode.childs.forEach(child => {

        const flowElement = moddle.create(child.bpmn.type, { id: `node.${child.pathKey}`, name: child.definition?.title || child.name });
        elementIndex[flowElement.id] = flowElement;
        flowElement.$isNode = true;
        flowElement.$node = child;
        child.$flow = flowElement;
        targetFlowElementsContainer.$nodes.push(flowElement);
        flowElements.push(flowElement);

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
            documentation: [moddle.create('bpmn:Documentation', { text: `Atom Workflow - ${root.context.atom.name}` })],
            // atom: moddle.create('atom:Atom', { type: "Test" })
            // extensionElements: moddle.create('bpmn:ExtensionElements', { values: [custom] })
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

module.exports = async (context = {}) => {
  return await modelA(cloneDeep(context));
};