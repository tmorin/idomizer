import {StringDictionary} from './StringDictionary';

/**
 * The purpose of a tag handler is to convert tags to JavaScript instructions.
 */
export interface TagHandler {
    onopentag(
        name: string,
        attrs: StringDictionary,
        key: string,
        statics: StringDictionary,
        varArgs: StringDictionary,
        options: Options
    ): string

    onclosetag?(
        name: string,
        options: Options
    ): string
}

/**
 * Dictionary of tag handlers.
 */
export interface TagHandlers {
    [k: string]: TagHandler
}

/**
 * The default tag handlers.
 */
export interface DefaultTagHandlers extends TagHandlers {
    /**
     * @example
     * ```javascript
     * idomizer.compile('<tpl-logger level="info" content="data.foo: {{data.foo}}"/>');
     * ```
     */
    'tpl-logger': TagHandler

    /**
     * @example
     * ```javascript
     * idomizer.compile(`
     *   <tpl-each items="data.values" item="value" index="i">\\n
     *     <li tpl-key="value-{{i}}">
     *       <tpl-text value="{{value}}"/>
     *     </li>
     *   </tpl-each>
     * `);
     * ```
     */
    'tpl-each': TagHandler

    /**
     * @example
     * ```javascript
     * idomizer.compile(`
     *   <tpl-if expression="data.values.length === 1">
     *     <p>1 value</p>
     *   <tpl-else-if expression="data.values.length > 1" />
     *     <p>some values</p>
     *   <tpl-else />
     *     <p>no values to display</p>
     *   </tpl-if>
     * `);
     * ```
     */
    'tpl-if': TagHandler

    /**
     * @example
     * ```javascript
     * idomizer.compile(`
     *   <tpl-if expression="data.values.length === 1">
     *     <p>1 value</p>
     *   <tpl-else-if expression="data.values.length > 1" />
     *     <p>some values</p>
     *   </tpl-if>
     * `);
     * ```
     */
    'tpl-else-if': TagHandler

    /**
     * @example
     * ```javascript
     * idomizer.compile(`
     *   <tpl-if expression="data.values.length === 1">
     *     <p>1 value</p>
     *   <tpl-else />
     *     <p>no values to display</p>
     *   </tpl-if>
     * `);
     * ```
     */
    'tpl-else': TagHandler

    /**
     * @example
     * ```javascript
     * idomizer.compile(`<tpl-text value="data.foo: {{data.foo}}" >;`);
     * ```
     */
    'tpl-text': TagHandler

    /**
     * @example
     * ```javascript
     * let anotherRenderFunction = // antoher IncrementalDOM render function
     * idomizer.compile(`
     *   <tpl-call name="anotherRender"/>
     * `)(IncrementalDOM, {
     *   anotherRender: anotherRenderFunction
     * });
     * ```
     */
    'tpl-call': TagHandler
}

/**
 * The idomizer options.
 */
export interface Options {
    /**
     * Append a end of line character ('\\n') after each statements.
     */
    pretty?: boolean
    /**
     * Discovered static attributes will be handled as dynamic attributes.
     */
    ignoreStaticAttributes?: boolean
    /**
     * Regular expression to inject interpolated values.
     */
    interpolation?: RegExp
    /**
     * Regular expression to inject JavaScript code.
     */
    expression?: RegExp
    /**
     * The name of the IncrementalDOM's key. Should be used when dealing with loops.
     */
    attributeKey?: string
    /**
     * The flag to skip the process eventual children.
     * @example
     * ```
     * <p tpl-skip><!-- existing children will not be touched --></p></code>
     * ```
     */
    attributeSkip?: string
    /**
     * If true exceptions raised during interpolation will be skipped and an empty string wil be used as result value.<br>By default <code>true</code>.
     */
    skipExceptions?: boolean
    /**
     * If true element name having `-` or having an attribute `is` will be skipped.
     * By default `true`.
     */
    skipCustomElements?: boolean
    /**
     * The name of the variable exposing the data.
     */
    varDataName?: string
    /**
     * The name of the variable exposing the helpers.
     */
    varHelpersName?: string
    /**
     * The list of self closing elements. (http://www.w3.org/TR/html5/syntax.html#void-elements)
     */
    selfClosingElements?: string[]
    /**
     * The built in and custom tags.
     */
    tags?: TagHandlers
}
