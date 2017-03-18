# idomizer

[![Circle CI](https://circleci.com/gh/tmorin/idomizer/tree/master.svg?style=svg)](https://circleci.com/gh/tmorin/idomizer/tree/master)
[![Dependency Status](https://david-dm.org/tmorin/idomizer.svg)](https://david-dm.org/tmorin/idomizer)
[![devDependency Status](https://david-dm.org/tmorin/idomizer/dev-status.svg)](https://david-dm.org/tmorin/idomizer#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/github/tmorin/idomizer/badge.svg?branch=master)](https://coveralls.io/github/tmorin/idomizer?branch=master)
<img data-ice="coverageBadge" src="http://tmorin.github.io/idomizer/badge.svg">

An HTML template compiler providing an [incremental-dom](google.github.io/incremental-dom) render factory.

Versions and compatibilities:

- idomizer <= 0.5 -> _incremental-dom_ 0.4 and below.
- idomizer >= 0.6 -> _incremental-dom_ 0.5 and above.

## Installation

```bash
$ npm install idomizer
```

```html
<script src="https://ajax.googleapis.com/ajax/libs/incrementaldom/0.5.1/incremental-dom-min.js"></script>
<script src="https://unpkg.com/idomizer/dist/idomizer.min.js"></script>
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
    plugins: ['idomizer/lib/plugins/babel-idomizer.js']
}
```

Presently the plugin only support ES6 templates tagged with _idomizer_.

For instance,
```javascript
let template = idomizer`<h1 class="{{data.h1Class}}">Hello</h1>`;
```
will be compiled into:
```javascript
var template = function (_i, _h) {
  var _elementOpen = _i.elementOpen,
      _elementClose = _i.elementClose,
      _elementVoid = _i.elementVoid,
      _text = _i.text,
      _skip = _i.skip;
  return function (_data_) {
    var helpers = _h || {},
        data = _data_ || {};
    _elementOpen('h1', null, null, 'class', data.h1Class);
    _text('Hello');
    _elementClose('h1');
  };
};
```

Be aware the template can not contain expressions like ``${anExpression}``.

### Webpack

A webpack's loader is available to compile an idomizer file into an incremental-dom render factory.

See [module.loaders](http://webpack.github.io/docs/configuration.html#module-loaders) to get more information about loaders in webpack.

```
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
function template(_i, _h) {
  var _elementOpen = _i.elementOpen,
      _elementClose = _i.elementClose,
      _elementVoid = _i.elementVoid,
      _text = _i.text,
      _skip = _i.skip;
  return function (_data_) {
    var helpers = _h || {},
        data = _data_ || {};
    _elementOpen('h1', null, ['class', 'main'], null);
    _text('Hello');
    _elementClose('h1');
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
function template(_i, _h) {
  var _elementOpen = _i.elementOpen,
      _elementClose = _i.elementClose,
      _elementVoid = _i.elementVoid,
      _text = _i.text,
      _skip = _i.skip;
  return function (_data_) {
    var helpers = _h || {},
        data = _data_ || {};
    _elementOpen('h1', null, ['class', 'main'], null);
    _text('Hello');
    _elementClose('h1');
  };
}
```

### Dynamic attributes

From
```javascript
idomizer.compile(`<h1 class="{{data.h1Class}}">Hello</h1>`)(IncrementalDOM)
```
To
```javascript
function template(_i, _h) {
  var _elementOpen = _i.elementOpen,
      _elementClose = _i.elementClose,
      _elementVoid = _i.elementVoid,
      _text = _i.text,
      _skip = _i.skip;
  return function (_data_) {
    var helpers = _h || {},
        data = _data_ || {};
    _elementOpen('h1', null, null, 'class', (data.h1Class));
    _text('Hello');
    _elementClose('h1');
  };
}
```

### Self closing elements

From
```javascript
idomizer.compile(`<input type="text" value="{{data.value}}">`)(IncrementalDOM)
```
To
```javascript
function template(_i, _h) {
  var _elementOpen = _i.elementOpen,
      _elementClose = _i.elementClose,
      _elementVoid = _i.elementVoid,
      _text = _i.text,
      _skip = _i.skip;
  return function (_data_) {
    var helpers = _h || {},
        data = _data_ || {};
    _elementVoid('input', null, ['type', 'text'], 'value', (data.value));
  };
}
```

### Dynamic text nodes

From
```javascript
idomizer.compile(`<strong><tpl-text value="data.value"/></strong>`)(IncrementalDOM)
// or
idomizer.compile(`<strong>{{ data.value }}</strong>`)(IncrementalDOM)
```
To
```javascript
function template(_i, _h) {
  var _elementOpen = _i.elementOpen,
      _elementClose = _i.elementClose,
      _elementVoid = _i.elementVoid,
      _text = _i.text,
      _skip = _i.skip;
  return function (_data_) {
    var helpers = _h || {},
        data = _data_ || {};
    _elementOpen('strong', null, null, null);
    _text(data.value);
    _elementClose('strong');
  };
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
function template(_i, _h) {
  var _elementOpen = _i.elementOpen,
      _elementClose = _i.elementClose,
      _elementVoid = _i.elementVoid,
      _text = _i.text,
      _skip = _i.skip;
  return function (_data_) {
    var helpers = _h || {},
        data = _data_ || {};
    if (data.yes) {
        _text('YES!');
    } else if (data.yes !== false) {
        _text('MAY BE!');
    } else {
        _text('NO!');
    }
  };
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
function template(_i, _h) {
  var _elementOpen = _i.elementOpen,
      _elementClose = _i.elementClose,
      _elementVoid = _i.elementVoid,
      _text = _i.text,
      _skip = _i.skip;
  return function (_data_) {
    var helpers = _h || {},
        data = _data_ || {};
    (data.items || []).forEach(function (item, index) {
        _elementOpen('strong', (index), null, null);
            _text(index);
            _text('-');
            _text(item);
        _elementClose('strong');
    });
  };
}
```

### Iteration with inline javascript

From
```javascript
idomizer.compile(`
    [[ data.items.forEach(function (item, i) { ]]
        <strong tpl-key="{{i}}">
            <tpl-text value="i"/>-<tpl-text value="item"/>
        </strong>
    [[ }); ]]
`)(IncrementalDOM);
```
To
```javascript
function template(_i, _h) {
  var _elementOpen = _i.elementOpen,
      _elementClose = _i.elementClose,
      _elementVoid = _i.elementVoid,
      _text = _i.text,
      _skip = _i.skip;
  return function (_data_) {
    var helpers = _h || {},
        data = _data_ || {};
    data.items.forEach(function (item, i) {
        _elementOpen('strong', (i), null, null);
            _text(i);
            _text('-');
            _text(item);
        _elementClose('strong');
    });
  };
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
function template(_i, _h) {
  var _elementOpen = _i.elementOpen,
      _elementClose = _i.elementClose,
      _elementVoid = _i.elementVoid,
      _text = _i.text,
      _skip = _i.skip;
  return function (_data_) {
    var helpers = _h || {},
        data = _data_ || {};
    _elementOpen('strong', null, null, null);
      _text('strong text');
    _elementClose('strong');
    _text('x-test element');
    _elementOpen('strong', null, null, null);
      _text('strong text');
    _elementClose('strong');
  };
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
function template(_i, _h) {
  var _elementOpen = _i.elementOpen,
      _elementClose = _i.elementClose,
      _elementVoid = _i.elementVoid,
      _text = _i.text,
      _skip = _i.skip;
  return function (_data_) {
    var helpers = _h || {},
        data = _data_ || {};
    _elementOpen('strong', null, null, null);
        _text('strong text');
    _elementClose('strong');
    helpers.subRender(data);
    _elementOpen('strong', null, null, null);
        _text('strong text');
    _elementClose('strong');
  };
}
```

### Custom elements

For Incremental DOM, custom elements are regular HTML elements.
So, if a custom element generates a sub-tree (i.e. a light DOM) outside a ShadowDOM node,
it will be overridden during the execution of the function `patch()`.
To control this default behavior, Incremental DOM provides the function `skip()` saying:
_don't touch the inner light DOM of the current node!_

By default idomizier detects the custom elements and force the call of the function `skip()` to protect their light DOM nodes.
Custom elements are detected according to the following rules:

- from the name, because of the `-` character
- from the attribute `ìs`

Obviously, this behavior can be deactivated:

- globally (for a whole HTML template)
    ```javascript
    const render = compile(`<x-element><p>will part of the light DOM</p></x-element>`, {skipCustomElements : false})
    ```
- locally (an HTML element), ``
    ```javascript
    const render = compile(`<x-element tpl-skip="deactivated"><p>will part of the light DOM</p></x-element>`)
    ```

If the **skip** flag is not set (globally or locally) the following snippet will raise an error:
```html
<x-element><p>will part of the light DOM</p></x-element>
```
