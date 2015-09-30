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

            IncrementalDOM.patch(body, render);
            expect(body.innerHTML).to.eq('<h1 class="main">Hello</h1>');

            done();
        });
    });

    it('should render a simple h1 with a dynamic attribute', (done) => {
        let render = compile(`<h1 class="{{data.h1Class}}">Hello</h1>`)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;

            IncrementalDOM.patch(body, render, { h1Class: 'main' });
            expect(body.innerHTML).to.eq('<h1 class="main">Hello</h1>');

            IncrementalDOM.patch(body, render, { h1Class: 'main bis' });
            expect(body.innerHTML).to.eq('<h1 class="main bis">Hello</h1>');

            done();
        });
    });

    it('should render a simple input with a dynamic attribute', (done) => {
        let render = compile(`<input type="text" value="{{data.value}}">`)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;

            IncrementalDOM.patch(body, render, { value: 'value' });
            expect(body.innerHTML).to.eq('<input type="text" value="value">');

            IncrementalDOM.patch(body, render, { value: 'value bis' });
            expect(body.innerHTML).to.eq('<input type="text" value="value bis">');

            done();
        });
    });

    it('should render a text from the tpl-text element', (done) => {
        let render = compile(`<strong><tpl-text value="data.value"/></strong>`)(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;

            IncrementalDOM.patch(body, render, { value: 'value' });
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

            IncrementalDOM.patch(body, render, { items: ['item0', 'item1'] });
            expect(body.innerHTML.trim()).to.eq('<strong>0-item0</strong><strong>1-item1</strong>');

            IncrementalDOM.patch(body, render, { items: ['item0', 'item1', 'item2'] });
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

            IncrementalDOM.patch(body, render, { items: ['item0', 'item1'] });
            expect(body.innerHTML.trim()).to.eq('<strong>0-item0</strong><strong>1-item1</strong>');

            IncrementalDOM.patch(body, render, { items: ['item0', 'item1', 'item2'] });
            expect(body.innerHTML.trim()).to.eq('<strong>0-item0</strong><strong>1-item1</strong><strong>2-item2</strong>');

            done();
        });
    });

    it('should use custom elements', (done) => {
        let render = compile(`<strong>strong text</strong><x-test></x-test><strong>strong text</strong>`, {
            elements: {
                'x-test': {
                    onopentag(name, attrs, key, statics, varArgs, options) {
                        return `t('${name} element');`;
                    }
                }
            }
        })(IncrementalDOM);
        env('', function (err, win) {
            let body = win.document.body;
            global.Element = win.Element;

            IncrementalDOM.patch(body, render, { items: ['item0', 'item1'] });
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

            IncrementalDOM.patch(body, render, { items: ['item0', 'item1'] });
            expect(body.innerHTML.trim()).to.eq('<strong>strong text</strong>helper content<strong>strong text</strong>');

            done();
        });
    });

});