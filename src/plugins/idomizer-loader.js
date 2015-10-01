import loaderUtils from 'loader-utils';
import {toStringFunction} from './utils.js';

/**
 * @ignore
 */
export default function (source) {
    this.cacheable();
    let query = loaderUtils.parseQuery(this.query);
    return toStringFunction(source, query);
}

