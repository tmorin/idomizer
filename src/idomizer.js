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
 * @desc The built in tags provided by idomizer.
 *
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
 * @example <caption>tpl-if, tpl-else-if and tpl-else</caption>
 * idomizer.compile(`
 *   <tpl-if condition="data.values.length === 1">
 *     <p>1 value</p>
 *   <tpl-else-if condition="data.values.length > 1" />
 *     <p>some values</p>
 *   <tpl-else />
 *     <p>no values to display</p>
 *   </tpl-if>
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
 * @property {function} tpl-if to condition a sub tree
 * @property {function} tpl-else-if to condition a sub tree within a tpl-if element
 * @property {function} tpl-else to condition a sub tree within a tpl-if element
 * @property {function} tpl-text to create a text node
 * @property {function} tpl-call to call an helpers with the current _data_ value
 */
const BUILT_IN_TAGS = {
    'tpl-logger': {
        onopentag(name, attrs, key, statics, varArgs, options) {
            /* istanbul ignore next */
            let level = statics.level || varArgs.level || 'log',
                content = statics.content || varArgs.content || '';
            /* istanbul ignore next */
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
        onclosetag(name, options) {
            return `});`;
        }
    },
    'tpl-if': {
        onopentag(name, attrs, key, statics, varArgs, options) {
            let expression = statics.expression || varArgs.expression || 'false';
            return `if (${expression}) {`;
        },
        onclosetag(name, options) {
            return `}`;
        }
    },
    'tpl-else-if': {
        onopentag(name, attrs, key, statics, varArgs, options) {
            let expression = statics.expression || varArgs.expression || 'false';
            return ` } else if (${expression}) { `;
        }
    },
    'tpl-else': {
        onopentag(name, attrs, key, statics, varArgs, options) {
            return ` } else { `;
        }
    },
    'tpl-text': {
        onopentag(name, attrs, key, statics, varArgs, options) {
            return `_text(${statics.value || varArgs.value});`;
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
 * @desc The override-able options of idomizer.
 * @property {boolean} pretty Append a end of line character ('\\n' ) after each statements.
 * @property {boolean} ignoreStaticAttributes Discovered static attributes will be handled as dynamic attributes.
 * @property {!RegExp} evaluation A RegExp to extracts expressions to evaluate.
 * @property {!string} attributeKey The value of the IncrementalDOM's key.
 * <br>using a constant value: <code>&lt;hr tpl-key="'constant value'"&gt;</code>
 * <br>using a dynamic value: <code>&lt;hr tpl-key="dynamicValue"&gt;</code>
 * @property {!string} attributeSkip The flag to skip the process eventual children.
 * <code>&lt;p tpl-skip&gt;&lt;!-- existing children will not be touched --&gt;&lt;/p&gt;</code>
 * @property {!boolean} skipCustomElements If true element name having <code>-</code> or having an attribute <code>is</code> will be skipped. By default <code>true</code>.
 * @property {!string} varDataName The name of the variable exposing the data.
 * @property {!string} varHelpersName The name of the variable exposing the helpers.
 * @property {!Array<string>} selfClosingElements The list of self closing elements. (http://www.w3.org/TR/html5/syntax.html#void-elements)
 * @property {!BUILT_IN_TAGS} tags The built in and custom tags.
 */
const OPTIONS = {
    pretty: false,
    ignoreStaticAttributes: false,
    evaluation: /\{\{([\s\S]+?)}}/gm,
    attributeKey: 'tpl-key',
    attributeSkip: 'tpl-skip',
    skipCustomElements: true,
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

function getFunctionName(name = '', options = OPTIONS) {
    return isSelfClosing(name, options) ? '_elementVoid' : '_elementOpen';
}

function append(body = '', line = '', options = OPTIONS) {
    return body + (options.pretty ? '\n' : '') + line;
}

/**
 * @typedef {Object} Evaluator
 * @desc Configuration to transform an expression into a compliant JavaScript fragment.
 * @private
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
function evaluate(value, evaluator, options) {
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

function wrapExpressions(value, options) {
    return value.replace(options.evaluation, '<![CDATA[$&]]>');
}

function unwrapExpressions(value) {
    return value.replace(/<!\[CDATA\[/gim, '').replace(/]]>/gim, '');
}

function checkSkipAttribute(attrs = {}, options = OPTIONS) {
    return attrs.hasOwnProperty(options.attributeSkip) && attrs[options.attributeSkip] !== 'deactivated';
}

function checkIsAttribute(attrs = {}, options = OPTIONS) {
    return options.skipCustomElements && attrs.hasOwnProperty('is') && attrs[options.attributeSkip] !== 'deactivated';
}

function parseAttributes(attrs = {}, options = OPTIONS) {
    let statics = {},
        varArgs = {},
        key,
        skip = checkSkipAttribute(attrs, options) || checkIsAttribute(attrs, options);
    Object.keys(attrs)
        .filter(key => [options.attributeSkip].indexOf(key) < 0)
        .forEach(function (key) {
            let value = unwrapExpressions(attrs[key]);
            if (value.search(options.evaluation) > -1 || options.ignoreStaticAttributes) {
                varArgs[key] = evaluate(value, attributeEvaluator, options);
            } else {
                statics[key] = value;
            }
        });
    key = statics[options.attributeKey] || varArgs[options.attributeKey];
    delete statics[options.attributeKey];
    delete varArgs[options.attributeKey];
    return [statics, varArgs, key, skip];
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

function checkCustomElement(name = '', attrs = {}, options = OPTIONS) {
    return options.skipCustomElements && attrs[options.attributeSkip] !== 'deactivated' && name.indexOf('-') > -1;
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
    let parser = new htmlparser2.Parser({
        onopentag(name, attrs) {
            let [statics, varArgs, key, skip] = parseAttributes(attrs, options);
            if (options.tags[name]) {
                let element = options.tags[name];
                if (typeof element.onopentag === 'function') {
                    fnBody = append(fnBody, element.onopentag(name, attrs, key, statics, varArgs, options), options);
                }
            } else {
                let fn = getFunctionName(name, options);
                fnBody = append(fnBody, `${fn}('${name}', ${key ? `${key}` : 'null'}, ${staticsToJs(statics)}, ${varArgsToJs(varArgs)});`, options);
                if (skip || checkCustomElement(name, attrs, options)) {
                    fnBody = append(fnBody, `_skip();`, options);
                }
            }
        },
        onclosetag(name) {
            if (options.tags[name]) {
                let element = options.tags[name];
                if (typeof element.onclosetag === 'function') {
                    fnBody = append(fnBody, element.onclosetag(name, options), options);
                }
            } else if (!isSelfClosing(name, options)) {
                fnBody = append(fnBody, `_elementClose('${name}');`, options);
            }
        },
        ontext(text){
            if (text.search(options.evaluation) > -1) {
                fnBody = append(fnBody, `${evaluate(text, inlineEvaluator, options)}`, options);
            } else {
                fnBody = append(fnBody, `_text('${stringify(text)}');`, options);
            }
        }
    }, {
        xmlMode: false,
        decodeEntities: true,
        lowerCaseTags: false,
        lowerCaseAttributeNames: false,
        recognizeSelfClosing: true,
        recognizeCDATA: true
    });

    // wrap inline expression with a CDATA tag to allow inline javascript
    parser.parseComplete(wrapExpressions(html, options));

    let fnWrapper = `
        var _elementOpen = _i.elementOpen,
            _elementClose = _i.elementClose,
            _elementVoid = _i.elementVoid,
            _text = _i.text,
            _skip = _i.skip;
        return function (_data_) {
            var ${options.varHelpersName || 'helpers'} = _h || {},
                ${options.varDataName || 'data'} = _data_ || {};
            ${fnBody}
        };
    `;

    let factory = new Function(['_i', '_h'], fnWrapper);

    return factory;
}

