# idomizer

[![Circle CI](https://circleci.com/gh/tmorin/idomizer/tree/master.svg?style=svg)](https://circleci.com/gh/tmorin/idomizer/tree/master)
[![Dependency Status](https://david-dm.org/tmorin/idomizer.svg)](https://david-dm.org/tmorin/idomizer)
[![devDependency Status](https://david-dm.org/tmorin/idomizer/dev-status.svg)](https://david-dm.org/tmorin/idomizer#info=devDependencies)

An HTML template parser compiling an incremental-dom render factory.

## Installation

```shell
npm install idomizer
```

```shell
bower install idomizer
```

```html
<script src="path/to/incremental-dom"></script>
<script src="path/to/idomizer.js"></script>
<script>
    var factory = idomizer.compile('<h1>Hello!</h1>');
    var render = factory(IncrementalDOM);
    IncrementalDOM.patch(document.body, render);
</script>
```

## Get the factory of an IncrementalDOM's render method

``idomizer.compile`` transforms an HTML template into a factory method.

```javascript
// idomizer.compile('<h1 class="main">Hello</h1>') will return:
function factory(i, h) {
    var o = i.elementOpen,
        c = i.elementClose,
        v = i.elementVoid,
        t = i.text,
        ph = i.elementPlaceholder;
    return function(_data_) {
        var helpers = h || {},
            data = _data_ || {};
        // generated javascript
        // ...
    };
}
```

The factory method requires the IncrementalDOM library and an optional map of helpers.
The factory returns the IncrementalDOM's render method.

## Syntax

### Static attributes

From
```javascript
idomizer.compile(`<h1 class="main">Hello</h1>`)(IncrementalDOM);
```
To
```javascript
function (_data_) {
    var helpers = h || {},
        data = _data_ || {};
    o('h1', null, ['class', 'main'], null);
        t('Hello');
    c('h1');
}
```

### Dynamic attributes

From
```javascript
idomizer.compile(`<h1 class="{{data.h1Class}}">Hello</h1>`)(IncrementalDOM)
```
To
```javascript
function (_data_) {
    var helpers = h || {},
        data = _data_ || {};
    o('h1', null, null, 'class', (data.h1Class));
        t('Hello');
    c('h1');
}
```

### Self closing elements

From
```javascript
idomizer.compile(`<input type="text" value="{{data.value}}">`)(IncrementalDOM)
```
To
```javascript
function (_data_) {
    var helpers = h || {},
        data = _data_ || {};
    v('input', null, ['type', 'text'], 'value', (data.value));
}
```

### Dynamic text

From
```javascript
idomizer.compile(`<strong><tpl-text value="data.value"/></strong>`)(IncrementalDOM)
```
To
```javascript
function (_data_) {
    var helpers = h || {},
        data = _data_ || {};
    o('strong', null, null, null);
        t(data.value);
    c('strong');
}
```

### Iteration with the element each

From
```javascript
idomizer.compile(`
    <tpl-each items="data.items">
        <strong tpl-key="{{index}}">
            <tpl-text value="index"/>-<tpl-text value="item"/>
        </strong>
    </tpl-each>
`)(IncrementalDOM);
```
To
```javascript
function (_data_) {
    var helpers = h || {},
        data = _data_ || {};
    (data.items || []).forEach(function (item, index) {
        o('strong', (index), null, null);
            t(index);
            t('-');
            t(item);
        c('strong');
    });
}
```

### Iteration with inline javascript

From
```javascript
idomizer.compile(`
    {{ data.items.forEach(function (item, i) { }}
        <strong tpl-key="{{i}}">
            <tpl-text value="i"/>-<tpl-text value="item"/>
        </strong>
    {{ }); }}
`)(IncrementalDOM);
```
To
```javascript
function (_data_) {
    var helpers = h || {},
        data = _data_ || {};
    data.items.forEach(function (item, i) {
        o('strong', (i), null, null);
            t(i);
            t('-');
            t(item);
        c('strong');
    });
}
```

### Custom elements

From
```javascript
idomizer.compile(`<strong>strong text</strong><x-test></x-test><strong>strong text</strong>`, {
     elements: {
        'x-test': {
            onopentag(name, attrs, key, statics, varArgs, options) {
                return `t('${name} element');`;
            }
        }
    }
})(IncrementalDOM);
```
To
```javascript
function (_data_) {
    var helpers = h || {},
        data = _data_ || {};
    o('strong', null, null, null);
        t('strong text');
    c('strong');
    t('x-test element');
    o('strong', null, null, null);
        t('strong text');
    c('strong');
}
```

### Custom helpers

From
```javascript
let subRender = compile(`helper content`)(IncrementalDOM);
idomizer.compile(`
    <strong>strong text</strong>
    <tpl-call name="subRender" />
    <strong>strong text</strong>
`)(IncrementalDOM, {subRender});
```
To
```javascript
function (_data_) {
    var helpers = h || {},
        data = _data_ || {};
    o('strong', null, null, null);
        t('strong text');
    c('strong');
    helpers.subRender(data);
    o('strong', null, null, null);
        t('strong text');
    c('strong');
}
```
