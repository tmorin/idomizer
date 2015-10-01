import htmlparser2 from 'htmlparser2';

function assign() {
    return Array.prototype.reduce.call(arguments, function (target, source) {
        return Object.keys(Object(source)).reduce((target, key) => {
            target[key] = source[key];
            return target;
        }, target);
    });
}

/**
 * @typedef {Object} BUILT_IN_TAGS
 * The built in tags provided by idomizer.
 * @example <caption>tpl-logger</caption>
 * idomizer.compile(`<tpl-logger level="info" content="data.foo: {{data.foo}}" />`);
 *
 * @example <caption>tpl-each and tpl-text</caption>
 * idomizer.compile(`
 *   <tpl-each items="data.values" item="value" index="i">
 *     <li tpl-key="value-{{i}}">
 *       <tpl-text value="{{value}}"/>
 *     </li>
 *   </tpl-each>
 * `);
 *
 * @example <caption>tpl-call</caption>
 * let anotherRenderFunction = // antoher IncrementalDOM render function
 * idomizer.compile(`
 *   <tpl-call name="anotherRender"/>
 * `)(IncrementalDOM, {
 *   anotherRender: anotherRenderFunction
 * });
 *
 * @property {function} tpl-logger to append a console message
 * @property {function} tpl-each to iterate over an array
 * @property {function} tpl-text to create a text node
 * @property {function} tpl-call to call an helpers with the current _data_ value
 */
export const BUILT_IN_TAGS = {
    'tpl-logger': {
        onopentag(name, attrs, key, statics, varArgs, options) {
            let level = statics.level || varArgs.level || 'log',
                content = statics.content || varArgs.content || '';
            return `console.${level}(${content});`;
        }
    },
    'tpl-each': {
        onopentag(name, attrs, key, statics, varArgs, options) {
            let itemsName = statics.items || varArgs.items || `items`,
                itemName = statics.item || varArgs.item || `item`,
                indexName = statics.index || varArgs.index || `index`;
            return `(${itemsName} || []).forEach(function (${itemName}, ${indexName}) {`;
        },
        onclosetag(name, attrs, statics, varArgs, options) {
            return `});`;
        }
    },
    'tpl-text': {
        onopentag(name, attrs, key, statics, varArgs, options) {
            return `t(${statics.value || varArgs.value});`;
        }
    },
    'tpl-call': {
        onopentag(name, attrs, key, statics, varArgs, options) {
            let helperName = statics.name || varArgs.name;
            return `${options.varHelpersName}.${helperName}(${options.varDataName});`;
        }
    }
};

/**
 * @typedef {Object} OPTIONS
 * The overridable options of idomizer.
 * @property {boolean} pretty Append a end of line character ('\\n' ) after each statements.
 * @property {!RegExp} evaluation A RegExp to extracts expressions to evaluate.
 * @property {!string} attributeKey The value of the IncrementalDOM's key.
 * @property {!string} attributePlaceholder The flag to make the element acting as a placeholder.
 * @property {!string} varDataName The name of the variable exposing the data.
 * @property {!string} varHelpersName The name of the variable exposing the helpers.
 * @property {!Array<string>} selfClosingElements The list of self closing elements. (http://www.w3.org/TR/html5/syntax.html#void-elements)
 * @property {!BUILT_IN_TAGS} tags The built in and custom tags.
 */
export const OPTIONS = {
    pretty: false,
    evaluation: /\{\{([\s\S]+?)}}/gm,
    attributeKey: 'tpl-key',
    attributePlaceholder: 'tpl-placeholder',
    varDataName: 'data',
    varHelpersName: 'helpers',
    selfClosingElements: ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'],
    tags: BUILT_IN_TAGS
};

function stringify(value = '') {
    return value.replace(/'/gim, '\\\'').replace(/\n/gi, '\\n');
}

function isSelfClosing(name = '', options = OPTIONS) {
    return options.selfClosingElements.indexOf(name) > -1;
}

function getFunctionName(name = '', placeholder = false, options = OPTIONS) {
    return placeholder ? 'ph' : (isSelfClosing(name, options) ? 'v' : 'o');
}

function append(body = '', line = '', options = OPTIONS) {
    return body + (options.pretty ? '\n' : '') + line;
}

/**
 * Configuration to transform an expression ino a compliant JavaScript fragment.
 * @typedef {Object} Evaluator
 * @public
 * @property {!string} appender Appender between statements
 * @property {!function(text: string)} toText to convert a text statements
 * @property {!function(clause: string)} toJs to convert a js statements
 */

/**
 * Evaluator of attributes' value.
 * @type {Evaluator}
 */
const attributeEvaluator = {
    appender: ' + ',
    toText: text => `'${stringify(text)}'`,
    toJs: clause => `(${clause})`
};

/**
 * Evaluator of inline's value.
 * @type {Evaluator}
 */
const inlineEvaluator = {
    appender: ' ',
    toText: text => `t('${stringify(text)}');`,
    toJs: clause => `${clause}`
};

/**
 * Evaluate the string to return a JavaScript compliant syntax.
 * @param {!string} value the value
 * @param {!Evaluator} evaluator the evaluator's configuration
 * @param {!OPTIONS} options the options
 * @returns {string} a compliant JavaScript fragment
 */
export function evaluate(value, evaluator, options) {
    let js = [];
    let result;
    let lastIndex = 0;
    while ((result = options.evaluation.exec(value)) !== null) {
        let full = result[0];
        let group = result[1];
        let index = result.index;
        let before = value.substring(lastIndex, index);
        if (before) {
            js.push(evaluator.toText(before));
        }
        js.push(evaluator.toJs(group));
        lastIndex = index + full.length;
    }
    let after = value.substring(lastIndex, value.length);
    if (after) {
        js.push(evaluator.toText(after));
    }
    return js.join(evaluator.appender);
}

function parseAttributes(attrs = {}, options = OPTIONS) {
    let statics = {},
        varArgs = {},
        key,
        placeholder = attrs[options.attributePlaceholder] !== null && attrs[options.attributePlaceholder] !== undefined;
    Object.keys(attrs)
        .filter(key => [options.attributePlaceholder].indexOf(key) < 0)
        .forEach(function (key) {
            let value = attrs[key];
            if (value.search(options.evaluation) > -1) {
                varArgs[key] = evaluate(value, attributeEvaluator, options);
            } else {
                statics[key] = value;
            }
        });
    key = statics[options.attributeKey] || varArgs[options.attributeKey];
    delete statics[options.attributeKey];
    delete varArgs[options.attributeKey];
    return [statics, varArgs, key, placeholder];
}

/**
 * Helper to transform a map of variables attributes into a JavaScript compliant syntax.
 * @param {*} varArgs the variables arguments
 * @returns {string} the JavaScript
 */
function varArgsToJs(varArgs = {}) {
    let keys = Object.keys(varArgs);
    return keys.length > 0 ? (keys.map(key => `'${key}', ${varArgs[key]}`).join(', ')) : 'null';
}

/**
 * Helper to transform a map of statics attributes into a JavaScript compliant syntax.
 * @param {*} statics the statics
 * @returns {string} the JavaScript
 */
function staticsToJs(statics = {}) {
    let keys = Object.keys(statics);
    return keys.length > 0 ? `[${keys.map(key => `'${key}', '${stringify(statics[key])}'`).join(', ')}]` : 'null';
}

/**
 * Compile the given HTML template into a function factory.
 *
 * If the incrementalDOM argument is provided, this function will return a render function.
 * The render function is used with IncrementalDOM.patch.
 *
 * If the incrementalDOM argument is not provided, this function will return a factory function.
 * The factory function requires the IncrementalDOM library as argument and return the render function..
 *
 * Basically, when the template is compiled at build time, the IncrementalDOM should not be given.
 * When the template is compiled at runtime, the IncrementalDOM should be given.
 *
 * @param {!string} html the template
 * @param {OPTIONS} [options] the options
 * @returns {function(i: IncrementalDOM, h: Object)} the function factory
 */
export function compile(html = '', options = {}) {
    options = assign({}, OPTIONS, options, {
        tags: assign({}, BUILT_IN_TAGS, options.tags)
    });

    let fnBody = '';
    let skipClosing;
    let parser = new htmlparser2.Parser({
        onopentag(name, attrs) {
            let [statics, varArgs, key, placeholder] = parseAttributes(attrs, options);
            skipClosing = placeholder;
            if (options.tags[name]) {
                let element = options.tags[name];
                if (typeof element.onopentag === 'function') {
                    fnBody = append(fnBody, element.onopentag(name, attrs, key, statics, varArgs, options), options);
                }
            } else {
                let fn = getFunctionName(name, placeholder, options);
                fnBody = append(fnBody, `${fn}('${name}', ${key ? `${key}` : 'null'}, ${staticsToJs(statics)}, ${varArgsToJs(varArgs)});`, options);
            }
        },
        onclosetag(name) {
            if (options.tags[name]) {
                let element = options.tags[name];
                if (typeof element.onclosetag === 'function') {
                    fnBody = append(fnBody, element.onclosetag(name, options), options);
                }
            } else if (!isSelfClosing(name, options) && !skipClosing) {
                fnBody = append(fnBody, `c('${name}');`, options);
            }
            skipClosing = false;
        },
        ontext(text){
            if (text.search(options.evaluation) > -1) {
                fnBody = append(fnBody, `${evaluate(text, inlineEvaluator, options)}`, options);
            } else {
                fnBody = append(fnBody, `t('${stringify(text)}');`, options);
            }
        }
    }, {
        xmlMode: false,
        decodeEntities: true,
        lowerCaseTags: false,
        lowerCaseAttributeNames: false,
        recognizeSelfClosing: true
    });

    parser.parseComplete(html);

    let fnWrapper = `
        var o = i.elementOpen,
            c = i.elementClose,
            v = i.elementVoid,
            t = i.text,
            ph = i.elementPlaceholder;
        return function (_data_) {
            var ${options.varHelpersName || 'helpers'} = h || {},
                ${options.varDataName || 'data'} = _data_ || {};
            ${fnBody}
        };
    `;

    let factory = new Function(['i', 'h'], fnWrapper);

    return factory;
}
