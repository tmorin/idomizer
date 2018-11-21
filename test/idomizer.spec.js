import {compile} from '../src/idomizer.js';
import * as IncrementalDOM from 'incremental-dom';
import {expect} from 'chai';

describe('idomizer', () => {
    let sandbox;

    beforeEach(function () {
        sandbox = document.body.appendChild(document.createElement('div'));
    });

    it('should render a simple h1 with a static attribute', () => {
        const render = compile(`<h1 class="main">Hello</h1>`)(IncrementalDOM);
        IncrementalDOM.patch(sandbox, render);
        expect(sandbox.innerHTML).to.eq('<h1 class="main">Hello</h1>');
    });

    it('should render a simple h1 with a dynamic attributes', () => {
        const render = compile(`<h1 class="foo {{ data.h1Class }} bar">Hello</h1>`)(IncrementalDOM);
        IncrementalDOM.patch(sandbox, render, {h1Class: 'main'});
        expect(sandbox.innerHTML).to.eq('<h1 class="foo main bar">Hello</h1>');

        IncrementalDOM.patch(sandbox, render, {h1Class: 'child'});
        expect(sandbox.innerHTML).to.eq('<h1 class="foo child bar">Hello</h1>');
    });

    it('should render a simple input with a dynamic attribute', () => {
        const render = compile(`<input type="text" value="{{data.value}}">`, {skipExceptions: false})(IncrementalDOM);
        expect(render.toString()).to.match(/'input', null, \['type', 'text'\], 'value', \(data.value\)/);

        IncrementalDOM.patch(sandbox, render, {value: 'value'});
        expect(sandbox.innerHTML).to.eq('<input type="text" value="value">');

        IncrementalDOM.patch(sandbox, render, {value: 'value bis'});
        expect(sandbox.innerHTML).to.eq('<input type="text" value="value bis">');
    });

    it('should render a text from the tpl-text element', () => {
        const render = compile(`<strong><tpl-text value="data.value"/></strong>`)(IncrementalDOM);
        IncrementalDOM.patch(sandbox, render, {value: 'value'});
        expect(sandbox.innerHTML).to.eq('<strong>value</strong>');
    });

    it('should iterate over items with tpl-each element', () => {
        const render = compile(`
            <tpl-each items="data.items"><strong tpl-key="{{index}}"><tpl-text value="index"/>-<tpl-text value="item"/></strong></tpl-each>
        `)(IncrementalDOM);
        IncrementalDOM.patch(sandbox, render, {items: ['item0', 'item1']});
        expect(sandbox.innerHTML.trim()).to.eq('<strong>0-item0</strong><strong>1-item1</strong>');

        IncrementalDOM.patch(sandbox, render, {items: ['item0', 'item1', 'item2']});
        expect(sandbox.innerHTML.trim()).to.eq('<strong>0-item0</strong><strong>1-item1</strong><strong>2-item2</strong>');
    });

    it('should iterate over items with an inline statement', () => {
        const render = compile(`
            [[ data.items.forEach(function (item, index) { ]]<strong><tpl-text value="index"/>-<tpl-text value="item"/></strong>[[ }); ]]
        `)(IncrementalDOM);
        IncrementalDOM.patch(sandbox, render, {items: ['item0', 'item1']});
        expect(sandbox.innerHTML.trim()).to.eq('<strong>0-item0</strong><strong>1-item1</strong>');

        IncrementalDOM.patch(sandbox, render, {items: ['item0', 'item1', 'item2']});
        expect(sandbox.innerHTML.trim()).to.eq('<strong>0-item0</strong><strong>1-item1</strong><strong>2-item2</strong>');
    });

    it('should handle conditional statements with tpl-if, tpl-else-if and tpl-else-if elements', () => {
        const render = compile(`
            <tpl-if expression="data.items.length === 1">
                <p>1 item</p>
            <tpl-else-if expression="data.items.length > 1" >
                <p>items</p>
            </tpl-else-if>
            <tpl-else />
                <p>no items</p>
            </tpl-if>
        `)(IncrementalDOM);
        IncrementalDOM.patch(sandbox, render, {items: ['item0']});
        expect(sandbox.innerHTML.trim()).to.contain('<p>1 item</p>');

        IncrementalDOM.patch(sandbox, render, {items: ['item0', 'item2']});
        expect(sandbox.innerHTML.trim()).to.contain('<p>items</p>');

        IncrementalDOM.patch(sandbox, render, {items: []});
        expect(sandbox.innerHTML.trim()).to.contain('<p>no items</p>');
    });

    it('should handle conditional statements with inline statements', () => {
        const render = compile(`
            [[ if (data.items.length > 0 && data.items.length < 2) { ]]
                <p>1 item</p>
            [[ } else if (data.items.length > 1) { ]]
                <p>items</p>
            [[ } else { ]]
                <p>no items</p>
            [[ } ]]
        `)(IncrementalDOM);
        IncrementalDOM.patch(sandbox, render, {items: ['item0']});
        expect(sandbox.innerHTML.trim()).to.contain('<p>1 item</p>');

        IncrementalDOM.patch(sandbox, render, {items: ['item0', 'item2']});
        expect(sandbox.innerHTML.trim()).to.contain('<p>items</p>');

        IncrementalDOM.patch(sandbox, render, {items: []});
        expect(sandbox.innerHTML.trim()).to.contain('<p>no items</p>');
    });

    it('should use custom elements', () => {
        const render = compile(`<strong>strong text</strong><x-test></x-test><strong>strong text</strong>`, {
            tags: {
                'x-test': {
                    onopentag(name, attrs, key, statics, varArgs, options) {
                        return `_text('${name} element');`;
                    }
                }
            }
        })(IncrementalDOM);
        IncrementalDOM.patch(sandbox, render, {items: ['item0', 'item1']});
        expect(sandbox.innerHTML.trim()).to.eq('<strong>strong text</strong>x-test element<strong>strong text</strong>');
    });

    it('should call helpers', () => {
        const subRender = compile(`helper content`)(IncrementalDOM);
        const render = compile(`<strong>strong text</strong><tpl-call name="subRender" /><strong>strong text</strong>`)(IncrementalDOM, {subRender});
        IncrementalDOM.patch(sandbox, render, {items: ['item0', 'item1']});
        expect(sandbox.innerHTML.trim()).to.eq('<strong>strong text</strong>helper content<strong>strong text</strong>');
    });

    it('should skip content node', () => {
        const render1 = compile(`<strong>strong text</strong><p>skipped content</p><strong>strong text</strong>`)(IncrementalDOM);
        const render2 = compile(`<strong>strong text bis</strong><p tpl-skip></p><strong>strong text bis</strong>`)(IncrementalDOM);
        IncrementalDOM.patch(sandbox, render1);
        expect(sandbox.innerHTML.trim()).to.eq('<strong>strong text</strong><p>skipped content</p><strong>strong text</strong>', 'render1');

        IncrementalDOM.patch(sandbox, render2);
        expect(sandbox.innerHTML.trim()).to.eq('<strong>strong text bis</strong><p>skipped content</p><strong>strong text bis</strong>', 'render2');
    });

    it('should skip content node of custom element', () => {
        const render = compile(`<strong>strong text bis</strong><custom-element></custom-element><strong>strong text bis</strong>`)(IncrementalDOM);
        sandbox.innerHTML = `<strong>strong text</strong><custom-element>skipped content</custom-element><strong>strong text</strong>`;
        IncrementalDOM.patch(sandbox, render);
        expect(sandbox.innerHTML.trim()).to.eq('<strong>strong text bis</strong><custom-element>skipped content</custom-element><strong>strong text bis</strong>', 'render');
    });

    it('should not skip content node of custom element - locally', () => {
        const render = compile(`<strong>strong text bis</strong><custom-element tpl-skip="deactivated">content</custom-element><strong>strong text bis</strong>`)(IncrementalDOM);
        sandbox.innerHTML = `<strong>strong text</strong><custom-element>skipped content</custom-element><strong>strong text</strong>`;
        IncrementalDOM.patch(sandbox, render);
        expect(sandbox.innerHTML.trim()).to.eq('<strong>strong text bis</strong><custom-element>content</custom-element><strong>strong text bis</strong>', 'render');
    });

    it('should not skip content node of custom element - globally', () => {
        const render = compile(`<strong>strong text bis</strong><custom-element>content</custom-element><strong>strong text bis</strong>`, {skipCustomElements: false})(IncrementalDOM);
        sandbox.innerHTML = `<strong>strong text</strong><custom-element>skipped content</custom-element><strong>strong text</strong>`;
        IncrementalDOM.patch(sandbox, render);
        expect(sandbox.innerHTML.trim()).to.eq('<strong>strong text bis</strong><custom-element>content</custom-element><strong>strong text bis</strong>', 'render');
    });

    it('should skip content node of custom element having is attribute', () => {
        const render = compile(`<strong>strong text bis</strong><p is="custom-element"></p><strong>strong text bis</strong>`)(IncrementalDOM);
        sandbox.innerHTML = `<strong>strong text</strong><p is="custom-element">skipped content</p><strong>strong text</strong>`;
        IncrementalDOM.patch(sandbox, render);
        expect(sandbox.innerHTML.trim()).to.eq('<strong>strong text bis</strong><p is="custom-element">skipped content</p><strong>strong text bis</strong>', 'render');
    });

    it('should not skip content node of custom element having is attribute - locally', () => {
        const render = compile(`<strong>strong text bis</strong><p is="custom-element" tpl-skip="deactivated">content</p><strong>strong text bis</strong>`)(IncrementalDOM);
        sandbox.innerHTML = `<strong>strong text</strong><p is="custom-element">skipped content</p><strong>strong text</strong>`;
        IncrementalDOM.patch(sandbox, render);
        expect(sandbox.innerHTML.trim()).to.eq('<strong>strong text bis</strong><p is="custom-element">content</p><strong>strong text bis</strong>', 'render');
    });

    it('should not skip content node of custom element having is attribute - globally', () => {
        const render = compile(`<strong>strong text bis</strong><p is="custom-element">content</p><strong>strong text bis</strong>`, {skipCustomElements: false})(IncrementalDOM);
        sandbox.innerHTML = `<strong>strong text</strong><p is="custom-element">skipped content</p><strong>strong text</strong>`;
        IncrementalDOM.patch(sandbox, render);
        expect(sandbox.innerHTML.trim()).to.eq('<strong>strong text bis</strong><p is="custom-element">content</p><strong>strong text bis</strong>', 'render');
    });

    it('should ignore static attributes', () => {
        const render = compile(`
            <h1 class="foo {{data.h1Class}} bar" id="anId">Hello</h1>
        `, {ignoreStaticAttributes: true, skipExceptions: false})(IncrementalDOM);
        expect(render.toString()).to.match(/'class', 'foo ' \+ \(data.h1Class\) \+ ' bar', 'id', 'anId'/);

        IncrementalDOM.patch(sandbox, render, {h1Class: 'main'});
        expect(sandbox.innerHTML.trim()).to.eq('<h1 class="foo main bar" id="anId">Hello</h1>');

        IncrementalDOM.patch(sandbox, render, {h1Class: 'child'});
        expect(sandbox.innerHTML.trim()).to.eq('<h1 class="foo child bar" id="anId">Hello</h1>');
    });

    it('should interpolate text node', () => {
        const render1 = compile(`
            [[ if (data.v1 > 0) { ]]YES[[ } ]]<p class="a {{ data.att1 }} a {{ data.att2 }}">t {{ data.txtNode1 }} t {{ data.txtNode2 }} {{ }}</p>
        `)(IncrementalDOM);
        IncrementalDOM.patch(sandbox, render1, {
            v1: 1,
            txtNode1: 'value1',
            txtNode2: 'value2',
            att1: 'a1',
            att2: 'a2'
        });
        expect(sandbox.innerHTML.trim()).to.eq('YES<p class="a a1 a a2">t value1 t value2 </p>', 'render1');
    });

    it('should ingore interpolation exception', () => {
        const render1 = compile(`
            <p class="a {{ data.att1 }} a {{ foo.bar }}">t {{ foo.bar }} t {{ data.txtNode2 }}</p>
        `, {pretty: true, skipExceptions: true})(IncrementalDOM);
        IncrementalDOM.patch(sandbox, render1, {
            v1: 1,
            txtNode1: 'value1',
            txtNode2: 'value2',
            att1: 'a1',
            att2: 'a2'
        });
        expect(sandbox.innerHTML.trim()).to.eq('<p class="a a1 a ">t  t value2</p>', 'render1');
    });

});
