import {toStringFunction, toFunction} from './utils.js';

/**
 * @ignore
 */
export function translate(load) {
    return toStringFunction(load.source);
}

/**
 * @ignore
 */
export function instantiate(load) {
    return toFunction(load.source);
}
