import {toStringFunction} from './utils.js';

/**
 * @ignore
 */
export default function ({types: t}) {
    return {
        visitor: {
            TaggedTemplateExpression(path, state) {
                if (path.node.tag.name === 'idomizer' && path.node.quasi.quasis.length === 1) {
                    let factory = toStringFunction(path.node.quasi.quasis[0].value.cooked, state.opts);
                    path.replaceWithSourceString(factory);
                }
            }
        }
    };
}
