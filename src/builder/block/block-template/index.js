import cloneDeep from 'lodash.clonedeep';
import pick from 'lodash.pick';
import omit from 'lodash.omit';

import fnetExpression from '@fnet/expression';

async function hits({ node }) {
    return node.definition.hasOwnProperty('template');
}

async function init({ node, initNode }) {
}

async function resolve({ node, resolveTypeCommon, resolveNextBlock, transformExpression, transformValue }) {
}

export default {
    hits,
    init,
    resolve
};