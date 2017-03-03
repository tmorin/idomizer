import {compile} from '../src/idomizer.js';
import IncrementalDOM from 'incremental-dom';
import {env} from 'jsdom';
import {expect} from 'chai';

describe('idomizer', () => {

    it('should render a simple h1 with a static attribute', (done) => {
        let render = compile(`<h1 class="main">Hello</h1>`)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;

            IncrementalDOM.patch(body, render);
            expect(body.innerHTML).to.eq('<h1 class="main">Hello</h1>');

            done();
        });
    });

    it('should render a simple h1 with a dynamic attributes', (done) => {
        let render = compile(`<h1 class="foo {{data.h1Class}} bar">Hello</h1>`)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;

            IncrementalDOM.patch(body, render, {h1Class: 'main'});
            expect(body.innerHTML).to.eq('<h1 class="foo main bar">Hello</h1>');

            IncrementalDOM.patch(body, render, {h1Class: 'child'});
            expect(body.innerHTML).to.eq('<h1 class="foo child bar">Hello</h1>');

            done();
        });
    });

    it('should render a simple input with a dynamic attribute', (done) => {
        let render = compile(`<input type="text" value="{{data.value}}">`)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;

            expect(render.toString()).to.match(/'input', null, \['type', 'text'\], 'value', \(data.value\)/);

            IncrementalDOM.patch(body, render, {value: 'value'});
            expect(body.innerHTML).to.eq('<input type="text" value="value">');

            IncrementalDOM.patch(body, render, {value: 'value bis'});
            expect(body.innerHTML).to.eq('<input type="text" value="value bis">');

            done();
        });
    });

    it('should render a text from the tpl-text element', (done) => {
        let render = compile(`<strong><tpl-text value="data.value"/></strong>`)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;

            IncrementalDOM.patch(body, render, {value: 'value'});
            expect(body.innerHTML).to.eq('<strong>value</strong>');

            done();
        });
    });

    it('should iterate over items with tpl-each element', (done) => {
        let render = compile(`
            <tpl-each items="data.items"><strong tpl-key="{{index}}"><tpl-text value="index"/>-<tpl-text value="item"/></strong></tpl-each>
        `)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;

            IncrementalDOM.patch(body, render, {items: ['item0', 'item1']});
            expect(body.innerHTML.trim()).to.eq('<strong>0-item0</strong><strong>1-item1</strong>');

            IncrementalDOM.patch(body, render, {items: ['item0', 'item1', 'item2']});
            expect(body.innerHTML.trim()).to.eq('<strong>0-item0</strong><strong>1-item1</strong><strong>2-item2</strong>');

            done();
        });
    });

    it('should iterate over items with an inline statement', (done) => {
        let render = compile(`
            {{ data.items.forEach(function (item, index) { }}<strong><tpl-text value="index"/>-<tpl-text value="item"/></strong>{{ }); }}
        `)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;

            IncrementalDOM.patch(body, render, {items: ['item0', 'item1']});
            expect(body.innerHTML.trim()).to.eq('<strong>0-item0</strong><strong>1-item1</strong>');

            IncrementalDOM.patch(body, render, {items: ['item0', 'item1', 'item2']});
            expect(body.innerHTML.trim()).to.eq('<strong>0-item0</strong><strong>1-item1</strong><strong>2-item2</strong>');

            done();
        });
    });

    it('should handle conditional statements with tpl-if, tpl-else-if and tpl-else-if elements', (done) => {
        let render = compile(`
            <tpl-if expression="data.items.length === 1">
                <p>1 item</p>
            <tpl-else-if expression="data.items.length > 1" >
                <p>items</p>
            </tpl-else-if>
            <tpl-else />
                <p>no items</p>
            </tpl-if>
        `)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;

            IncrementalDOM.patch(body, render, {items: ['item0']});
            expect(body.innerHTML.trim()).to.contain('<p>1 item</p>');

            IncrementalDOM.patch(body, render, {items: ['item0', 'item2']});
            expect(body.innerHTML.trim()).to.contain('<p>items</p>');

            IncrementalDOM.patch(body, render, {items: []});
            expect(body.innerHTML.trim()).to.contain('<p>no items</p>');

            done();
        });
    });

    it('should handle conditional statements with inline statements', (done) => {
        let render = compile(`
            {{ if (data.items.length > 0 && data.items.length < 2) { }}
                <p>1 item</p>
            {{ } else if (data.items.length > 1) { }}
                <p>items</p>
            {{ } else { }}
                <p>no items</p>
            {{ } }}
        `)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;

            IncrementalDOM.patch(body, render, {items: ['item0']});
            expect(body.innerHTML.trim()).to.contain('<p>1 item</p>');

            IncrementalDOM.patch(body, render, {items: ['item0', 'item2']});
            expect(body.innerHTML.trim()).to.contain('<p>items</p>');

            IncrementalDOM.patch(body, render, {items: []});
            expect(body.innerHTML.trim()).to.contain('<p>no items</p>');

            done();
        });
    });

    it('should use custom elements', (done) => {
        let render = compile(`<strong>strong text</strong><x-test></x-test><strong>strong text</strong>`, {
            tags: {
                'x-test': {
                    onopentag(name, attrs, key, statics, varArgs, options) {
                        return `_text('${name} element');`;
                    }
                }
            }
        })(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;

            IncrementalDOM.patch(body, render, {items: ['item0', 'item1']});
            expect(body.innerHTML.trim()).to.eq('<strong>strong text</strong>x-test element<strong>strong text</strong>');

            done();
        });
    });

    it('should call helpers', (done) => {
        let subRender = compile(`helper content`)(IncrementalDOM);
        let render = compile(`<strong>strong text</strong><tpl-call name="subRender" /><strong>strong text</strong>`)(IncrementalDOM, {subRender});
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;

            IncrementalDOM.patch(body, render, {items: ['item0', 'item1']});
            expect(body.innerHTML.trim()).to.eq('<strong>strong text</strong>helper content<strong>strong text</strong>');

            done();
        });
    });

    it('should skip content node', (done) => {
        let render1 = compile(`<strong>strong text</strong><p>skipped content</p><strong>strong text</strong>`)(IncrementalDOM);
        let render2 = compile(`<strong>strong text bis</strong><p tpl-skip></p><strong>strong text bis</strong>`)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;
            IncrementalDOM.patch(body, render1);
            expect(body.innerHTML.trim()).to.eq('<strong>strong text</strong><p>skipped content</p><strong>strong text</strong>', 'render1');
            IncrementalDOM.patch(body, render2);
            expect(body.innerHTML.trim()).to.eq('<strong>strong text bis</strong><p>skipped content</p><strong>strong text bis</strong>', 'render2');

            done();
        });
    });

    it('should skip content node of custom element', (done) => {
        let render = compile(`<strong>strong text bis</strong><custom-element></custom-element><strong>strong text bis</strong>`)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;
            body.innerHTML = `<strong>strong text</strong><custom-element>skipped content</custom-element><strong>strong text</strong>`;
            IncrementalDOM.patch(body, render);
            expect(body.innerHTML.trim()).to.eq('<strong>strong text bis</strong><custom-element>skipped content</custom-element><strong>strong text bis</strong>', 'render');
            done();
        });
    });

    it('should not skip content node of custom element - locally', (done) => {
        let render = compile(`<strong>strong text bis</strong><custom-element tpl-skip="deactivated">content</custom-element><strong>strong text bis</strong>`)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;
            body.innerHTML = `<strong>strong text</strong><custom-element>skipped content</custom-element><strong>strong text</strong>`;
            IncrementalDOM.patch(body, render);
            expect(body.innerHTML.trim()).to.eq('<strong>strong text bis</strong><custom-element>content</custom-element><strong>strong text bis</strong>', 'render');
            done();
        });
    });

    it('should not skip content node of custom element - globally', (done) => {
        let render = compile(`<strong>strong text bis</strong><custom-element>content</custom-element><strong>strong text bis</strong>`, {skipCustomElements: false})(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;
            body.innerHTML = `<strong>strong text</strong><custom-element>skipped content</custom-element><strong>strong text</strong>`;
            IncrementalDOM.patch(body, render);
            expect(body.innerHTML.trim()).to.eq('<strong>strong text bis</strong><custom-element>content</custom-element><strong>strong text bis</strong>', 'render');
            done();
        });
    });

    it('should skip content node of custom element having is attribute', (done) => {
        let render = compile(`<strong>strong text bis</strong><p is="custom-element"></p><strong>strong text bis</strong>`)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;
            body.innerHTML = `<strong>strong text</strong><p is="custom-element">skipped content</p><strong>strong text</strong>`;
            IncrementalDOM.patch(body, render);
            expect(body.innerHTML.trim()).to.eq('<strong>strong text bis</strong><p>skipped content</p><strong>strong text bis</strong>', 'render');
            done();
        });
    });

    it('should not skip content node of custom element having is attribute - locally', (done) => {
        let render = compile(`<strong>strong text bis</strong><p is="custom-element" tpl-skip="deactivated">content</p><strong>strong text bis</strong>`)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;
            body.innerHTML = `<strong>strong text</strong><p is="custom-element">skipped content</p><strong>strong text</strong>`;
            IncrementalDOM.patch(body, render);
            expect(body.innerHTML.trim()).to.eq('<strong>strong text bis</strong><p>content</p><strong>strong text bis</strong>', 'render');
            done();
        });
    });

    it('should not skip content node of custom element having is attribute - globally', (done) => {
        let render = compile(`<strong>strong text bis</strong><p is="custom-element">content</p><strong>strong text bis</strong>`, {skipCustomElements: false})(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;
            body.innerHTML = `<strong>strong text</strong><p is="custom-element">skipped content</p><strong>strong text</strong>`;
            IncrementalDOM.patch(body, render);
            expect(body.innerHTML.trim()).to.eq('<strong>strong text bis</strong><p>content</p><strong>strong text bis</strong>', 'render');
            done();
        });
    });

    it('should ignore static attributes', (done) => {
        let render = compile(`<h1 class="foo {{data.h1Class}} bar" id="anId">Hello</h1>`, {ignoreStaticAttributes: true})(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;

            expect(render.toString()).to.match(/'class', 'foo ' \+ \(data.h1Class\) \+ ' bar', 'id', 'anId'/);

            IncrementalDOM.patch(body, render, {h1Class: 'main'});
            expect(body.innerHTML).to.eq('<h1 class="foo main bar" id="anId">Hello</h1>');

            IncrementalDOM.patch(body, render, {h1Class: 'child'});
            expect(body.innerHTML).to.eq('<h1 class="foo child bar" id="anId">Hello</h1>');

            done();
        });
    });

    it('should interpolate text node', (done) => {
        let render1 = compile(`<p>t {{= data.txtNode1 }} t {{= data.txtNode2 }}</p>`)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;
            global.Document = win.Document;
            IncrementalDOM.patch(body, render1, {txtNode1: 'value1', txtNode2: 'value2'});
            expect(body.innerHTML.trim()).to.eq('<p>t value1 t value2</p>', 'render1');
            done();
        });
    });

});
