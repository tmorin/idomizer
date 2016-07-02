var idomizer = require('../idomizer.js');

/**
 * @ignore
 */
export function toStringFunction(html, options) {
    return idomizer.compile(html, options).toString().replace('function anonymous', 'function');
}
