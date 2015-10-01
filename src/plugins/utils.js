import {compile} from '../idomizer.js';

/**
 * @ignore
 */
export function toStringFunction(html, options) {
    return compile(html, options).toString().replace('function anonymous', 'function');
}

/**
 * @ignore
 */
export function toFunction(stringFunction) {
    return new Function(['i', 'h'], `return (${stringFunction}(i, h));`);
}
