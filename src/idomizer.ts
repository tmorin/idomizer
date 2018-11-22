import {Parser} from 'htmlparser2';
import {Options} from './Options';
import {DefaultTagHandlers} from './Options';
import {StringDictionary} from './StringDictionary';
import {TagHandler} from './Options';

function assign(...args) {
    return args.reduce(function (target, source) {
        return Object.keys(Object(source)).reduce((target, key) => {
            target[key] = source[key];
            return target;
        }, target);
    });
}

/**
 * The default implementation of the default tag handlers.
 */
const DEFAULT_TAGS_HANDLERS: DefaultTagHandlers = {
    'tpl-logger': {
        onopentag(name, attrs, key, statics, varArgs) {
            let level = statics.level || varArgs.level || 'log',
                content = statics.content || varArgs.content || '';
            return `console.${level}(${content});`;
        }
    },
    'tpl-each': {
        onopentag(name, attrs, key, statics, varArgs) {
            let itemsName = statics.items || varArgs.items || `items`,
                itemName = statics.item || varArgs.item || `item`,
                indexName = statics.index || varArgs.index || `index`;
            return `(${itemsName} || []).forEach(function (${itemName}, ${indexName}) {`;
        },
        onclosetag() {
            return `});`;
        }
    },
    'tpl-if': {
        onopentag(name, attrs, key, statics, varArgs) {
            let expression = statics.expression || varArgs.expression || 'false';
            return `if (${expression}) {`;
        },
        onclosetag() {
            return `}`;
        }
    },
    'tpl-else-if': {
        onopentag(name, attrs, key, statics, varArgs) {
            let expression = statics.expression || varArgs.expression || 'false';
            return ` } else if (${expression}) { `;
        }
    },
    'tpl-else': {
        onopentag() {
            return ` } else { `;
        }
    },
    'tpl-text': {
        onopentag(name, attrs, key, statics, varArgs, options) {
            return inlineInterpolationEvaluator.inject(statics.value || varArgs.value, options);
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
 * The default options.
 */
const DEFAULT_OPTIONS: Options = {
    pretty: false,
    ignoreStaticAttributes: false,
    interpolation: /{{([\s\S]+?)}}/gm,
    expression: /\[\[([\s\S]+?)]]/gm,
    attributeKey: 'tpl-key',
    attributeSkip: 'tpl-skip',
    skipExceptions: true,
    skipCustomElements: true,
    varDataName: 'data',
    varHelpersName: 'helpers',
    selfClosingElements: ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'],
    tags: DEFAULT_TAGS_HANDLERS
};

function stringify(value = ''): string {
    return value.replace(/'/gim, '\\\'').replace(/\n/gi, '\\n');
}

function isSelfClosing(name = '', options = DEFAULT_OPTIONS): boolean {
    return options.selfClosingElements.indexOf(name) > -1;
}

function getFunctionName(name = '', options = DEFAULT_OPTIONS): string {
    return isSelfClosing(name, options) ? '_elementVoid' : '_elementOpen';
}

function append(body = '', line = '', options = DEFAULT_OPTIONS): string {
    if (line) {
        return body + (options.pretty ? '\n' : '') + line;
    }
    return body;
}

function createSafeJsBlock(value: string) {
    return `(function () { try { return ${value} } catch(e) { return '' } })()`;
}

/**
 * Configuration to transform an expression into a compliant JavaScript fragment.
 */
interface Evaluator {
    /**
     * Appender between statements.
     */
    appender: string
    /**
     * To convert a text statements.
     * @param value the value
     */
    toText?: (value: string, options: Options) => string
    /**
     * To convert a js statements.
     * @param value the value
     * @param options the options
     */
    inject: (value: string, options: Options) => string
}

const attributeEvaluator: Evaluator = {
    appender: ' + ',
    toText: (value) => `'${stringify(value)}'`,
    inject: (value, options: Options) => options.skipExceptions ? createSafeJsBlock(value.trim()) : `(${value.trim()})`
};

const inlineInterpolationEvaluator: Evaluator = {
    appender: ' ',
    inject: (value, options) => options.skipExceptions ? `_text(${createSafeJsBlock(value.trim())});` : `_text(${value.trim()});`
};

const inlineExpressionEvaluator: Evaluator = {
    appender: ' ',
    inject: value => `${value}`
};

function evaluate(value: string, evaluator: Evaluator, regex: RegExp, options: Options): string {
    let js = [];
    let result;
    let lastIndex = 0;
    while ((result = regex.exec(value)) !== null) {
        let full = result[0];
        let group = result[1];
        let index = result.index;
        let before = value.substring(lastIndex, index);
        if (before) {
            js.push(evaluator.toText(before, options));
        }
        if (group.trim()) {
            js.push(evaluator.inject(group, options));
        }
        lastIndex = index + full.length;
    }
    let after = value.substring(lastIndex, value.length);
    if (after) {
        js.push(evaluator.toText(after, options));
    }
    return js.join(evaluator.appender);
}

function wrapExpressions(value: string, options: Options): string {
    return value.replace(options.interpolation, '<![CDATA[$&]]>').replace(options.expression, '<![CDATA[$&]]>');
}

function unwrapExpressions(value: string): string {
    return value.replace(/<!\[CDATA\[/gim, '').replace(/]]>/gim, '');
}

function checkSkipAttribute(attrs: StringDictionary = {}, options = DEFAULT_OPTIONS): boolean {
    return attrs.hasOwnProperty(options.attributeSkip) && attrs[options.attributeSkip] !== 'deactivated';
}

function checkIsAttribute(attrs: StringDictionary = {}, options = DEFAULT_OPTIONS): boolean {
    return options.skipCustomElements && attrs.hasOwnProperty('is') && attrs[options.attributeSkip] !== 'deactivated';
}

function parseAttributes(attrs: StringDictionary = {}, options = DEFAULT_OPTIONS) {
    const skip: boolean = checkSkipAttribute(attrs, options) || checkIsAttribute(attrs, options);

    const statics: StringDictionary = {};
    const varArgs: StringDictionary = {};
    Object.keys(attrs)
        .filter(key => [options.attributeSkip].indexOf(key) < 0)
        .forEach(function (key) {
            let value = unwrapExpressions(attrs[key]);
            if (value.search(options.interpolation) > -1 || options.ignoreStaticAttributes) {
                varArgs[key] = evaluate(value, attributeEvaluator, options.interpolation, options);
            } else {
                statics[key] = value;
            }
        });

    const key = statics[options.attributeKey] || varArgs[options.attributeKey];
    delete statics[options.attributeKey];
    delete varArgs[options.attributeKey];

    return {statics, varArgs, key, skip};
}

function varArgsToJs(varArgs = {}): string {
    let keys = Object.keys(varArgs);
    return keys.length > 0 ? (keys.map(key => `'${key}', ${varArgs[key]}`).join(', ')) : 'null';
}

function staticsToJs(statics = {}): string {
    let keys = Object.keys(statics);
    return keys.length > 0 ? `[${keys.map(key => `'${key}', '${stringify(statics[key])}'`).join(', ')}]` : 'null';
}

function checkCustomElement(name = '', attrs: StringDictionary = {}, options = DEFAULT_OPTIONS): boolean {
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
 * @param html the template
 * @param options the options
 * @returns the function factory
 */
export function compile(html = '', options: Options = DEFAULT_OPTIONS): Function {
    options = assign({}, DEFAULT_OPTIONS, options, {
        tags: assign({}, DEFAULT_TAGS_HANDLERS, options.tags)
    });
    let fnBody = '';
    let parser = new Parser({
        onopentag(name, attrs) {
            const {statics, varArgs, key, skip} = parseAttributes(attrs, options);
            if (options.tags[name]) {
                const tagHandler: TagHandler = options.tags[name];
                if (typeof tagHandler.onopentag === 'function') {
                    fnBody = append(
                        fnBody,
                        tagHandler.onopentag(name, attrs, key, statics, varArgs, options),
                        options
                    );
                }
            } else {
                const fn = getFunctionName(name, options);
                fnBody = append(
                    fnBody,
                    `${fn}('${name}', ${key ? `${key}` : 'null'}, ${staticsToJs(statics)}, ${varArgsToJs(varArgs)});`,
                    options
                );
                if (skip || checkCustomElement(name, attrs, options)) {
                    fnBody = append(
                        fnBody,
                        `_skip();`,
                        options
                    );
                }
            }
        },
        onclosetag(name) {
            if (options.tags[name]) {
                const tagHandler: TagHandler = options.tags[name];
                if (typeof tagHandler.onclosetag === 'function') {
                    fnBody = append(
                        fnBody,
                        tagHandler.onclosetag(name, options),
                        options
                    );
                }
            } else if (!isSelfClosing(name, options)) {
                fnBody = append(
                    fnBody,
                    `_elementClose('${name}');`,
                    options
                );
            }
        },
        ontext(text) {
            if (text.search(options.expression) > -1) {
                fnBody = append(
                    fnBody,
                    `${evaluate(text, inlineExpressionEvaluator, options.expression, options)}`,
                    options
                );
            } else if (text.search(options.interpolation) > -1) {
                fnBody = append(
                    fnBody,
                    `${evaluate(text, inlineInterpolationEvaluator, options.interpolation, options)}`,
                    options
                );
            } else {
                fnBody = append(
                    fnBody,
                    `_text('${stringify(text)}');`,
                    options
                );
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
            var ${options.varHelpersName || 'helpers'} = _h,
                ${options.varDataName || 'data'} = _data_;
            ${fnBody}
        };
    `;

    // @ts-ignore
    return new Function(['_i', '_h'], fnWrapper);
}
