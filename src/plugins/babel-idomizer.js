import {toStringFunction} from './utils.js';

/**
 * @ignore
 */
export default function ({ Plugin, types: t }) {
    return new Plugin('idomizer', {
        visitor: {
            TaggedTemplateExpression: function (node, parent) {
                if (node.tag.name === 'idomizer' && node.quasi.quasis.length === 1) {
                    let factory = toStringFunction(node.quasi.quasis[0].value.cooked);
                    this.replaceWithSourceString(factory);
                }
            }
        }
    });
}