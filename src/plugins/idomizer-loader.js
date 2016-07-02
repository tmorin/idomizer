import loaderUtils from 'loader-utils';

var utils = require('./utils.js');

/**
 * @ignore
 */
module.exports = function (source) {
    this.cacheable();
    var query = loaderUtils.parseQuery(this.query);
    return 'module.exports = ' + utils.toStringFunction(source, query);
};

