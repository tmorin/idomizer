# idomizer

[![Circle CI](https://circleci.com/gh/tmorin/idomizer/tree/master.svg?style=svg)](https://circleci.com/gh/tmorin/idomizer/tree/master)
[![Dependency Status](https://david-dm.org/tmorin/idomizer.svg)](https://david-dm.org/tmorin/idomizer)
[![devDependency Status](https://david-dm.org/tmorin/idomizer/dev-status.svg)](https://david-dm.org/tmorin/idomizer#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/github/tmorin/idomizer/badge.svg?branch=master)](https://coveralls.io/github/tmorin/idomizer?branch=master)
<img data-ice="coverageBadge" src="http://tmorin.github.io/idomizer//badge.svg">

An HTML template compiler providing an _incremental-dom_ render factory.

## Installation

```shell
$ npm install idomizer
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

### Babel

A babel's plugin is available to compile an idomizer template into an incremental-dom render factory.

See [plugins](http://babeljs.io/docs/advanced/plugins) to get more information about plugins in babel.

```javascript
{
    plugins: ['idomizers/src/plugins/babel-idomizer.js']
}
```

Presently the plugin only support ES6 templates tagged with _idomizer_.
Further more the template can not contain expressions like ``${anExpression}``.

For instance,
```javascript
let template = idomizer`<h1 class="{{data.h1Class}}">Hello</h1>`;
```
will be compiled into:
```javascript
var template = function template(i, h) {
  var o = i.elementOpen,
      c = i.elementClose,
      v = i.elementVoid,
      t = i.text,
      ph = i.elementPlaceholder;
  return function (_data_) {
    var helpers = h || {},
        data = _data_ || {};
    o('h1', null, null, 'class', data.h1Class);
    t('Hello');
    c('h1');
  };
};
```

### Webpack

A webpack's loader is available to compile an idomizer file into an incremental-dom render factory.

See [module.loaders](http://webpack.github.io/docs/configuration.html#module-loaders) to get more information about loaders in webpack.

```javascript
module.loaders: [
    {test: /\.idomizer$/, loader: 'idomizer/lib/plugins/idomizer-loader'}
];
```

### Browserify

A browserify's transform module is available to compile an idomizer file into an incremental-dom render factory.

See [transforms](https://github.com/substack/browserify-handbook#transforms) to get more information about the transform system in browserify.

```shell
browserify -t idomizer/lib/plugins/idomizerify main.js > bundle.js
```

```javascript
var browserify = require('browserify');
var idomizerify = require('idomizer/lib/plugins/idomizerify');
var bundle = browserify();
bundle.transform({ extension: 'html' }, idomizerify);
```

## API

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

The factory method requires the _incremental-dom_ library and an optional map of helpers.
The factory returns the _incremental-dom_'s render method.

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

### Dynamic text nodes

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

### Condition with the tags _if_, _else-if_ and _else_

From
```javascript
idomizer.compile(`
    <tpl-if expression="data.yes">
        YES!
    <tpl-else-if expression="data.yes !== false" />
        MAY BE!
    <tpl-else/>
        NO!
    </tpl-if>
`)(IncrementalDOM);
```
To
```javascript
function (_data_) {
    var helpers = h || {},
        data = _data_ || {};
    if (data.yes) {
        t('YES!);
    } else if (data.yes !== false) {
        t('MAY BE!);
    } else {
        t('NO!);
    }
}
```

### Iteration with the tag _each_

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

### Custom tags

From
```javascript
idomizer.compile(`<strong>strong text</strong><x-test></x-test><strong>strong text</strong>`, {
     tags: {
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
