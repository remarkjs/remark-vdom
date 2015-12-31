# remark-vdom [![Build Status](https://img.shields.io/travis/wooorm/remark-vdom.svg)](https://travis-ci.org/wooorm/remark-vdom) [![Coverage Status](https://img.shields.io/codecov/c/github/wooorm/remark-vdom.svg)](https://codecov.io/github/wooorm/remark-vdom)

**remark-vdom** compiles markdown to
[Virtual DOM](https://github.com/Matt-Esch/virtual-dom/). Built on [**remark**](https://github.com/wooorm/remark),
an extensively tested and pluggable markdown parser.

*   [x] Inherently safe and sanitized: there is no way to pass raw HTML through.

*   [x] Supports footnotes, todo lists;

*   [ ] Future: support VNode [keys](https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript#key).

*   [ ] Future: allow custom components to overwrite default elements, e.g.,
    `MyLink` instead of `<a>`.

*   [ ] Future: Expose as [widget](https://github.com/Matt-Esch/virtual-dom/blob/903d884a8e4f05f303ec6f2b920a3b5237cf8b92/docs/widget.md)

Note: **remark-vdom** exposes an array of
[VNode](https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript)s.
You will probably need to wrap the result in, for example, an `article`
node, for rendering by virtual-dom.

## Installation

[npm](https://docs.npmjs.com/cli/install):

```bash
npm install remark-vdom
```

**remark-vdom** is also available for [duo](http://duojs.org/#getting-started),
and as an AMD, CommonJS, and globals module, [uncompressed and
compressed](https://github.com/wooorm/remark-vdom/releases).

## Table of Contents

*   [Usage](#usage)

*   [API](#api)

    *   [remark.use(vdom)](#remarkusevdom)

*   [Integrations](#integrations)

*   [License](#license)

## Usage

```javascript
var remark = require('remark');
var vdom = require('remark-vdom');
var doc = remark().use(vdom).process(
    'Some _emphasis_, **strongness**, and `code`.'
);
```

Yields (note it’s an array of nodes):

```txt
[ VirtualNode {
    tagName: 'P',
    properties: {},
    children: 
     [ VirtualText { text: 'Some ' },
       VirtualNode {
         tagName: 'EM',
         properties: {},
         children: [ VirtualText { text: 'emphasis' } ],
         key: undefined,
         namespace: null,
         count: 1,
         hasWidgets: false,
         hasThunks: false,
         hooks: undefined,
         descendantHooks: false },
       VirtualText { text: ', ' },
       VirtualNode {
         tagName: 'STRONG',
         properties: {},
         children: [ VirtualText { text: 'strongness' } ],
         key: undefined,
         namespace: null,
         count: 1,
         hasWidgets: false,
         hasThunks: false,
         hooks: undefined,
         descendantHooks: false },
       VirtualText { text: ', and ' },
       VirtualNode {
         tagName: 'CODE',
         properties: {},
         children: [ VirtualText { text: 'code' } ],
         key: undefined,
         namespace: null,
         count: 1,
         hasWidgets: false,
         hasThunks: false,
         hooks: undefined,
         descendantHooks: false },
       VirtualText { text: '.' } ],
    key: undefined,
    namespace: null,
    count: 10,
    hasWidgets: false,
    hasThunks: false,
    hooks: undefined,
    descendantHooks: false },
  VirtualText { text: '\n' } ]
```

## API

### [remark](https://github.com/wooorm/remark#api).[use](https://github.com/wooorm/remark#remarkuseplugin-options)(vdom)

**Parameters**

*   `vdom` — This plugin.

## Integrations

All [**mdast** nodes](https://github.com/wooorm/mdast) can be compiled to
HTML. Unknown **mdast** nodes are compiled to `div` nodes.

In addition, **remark-vdom** can be told how to compile nodes through three
`data` properties:

*   `htmlName` — Tag-name to compile as;
*   `htmlAttributes` — Map of attributes to add.

For example, the following node:

```json
{
  "type": "emphasis",
  "data": {
    "htmlName": "i",
    "htmlAttributes": {
      "id": "foo"
    }
  },
  "children": [{
    "type": "text",
    "value": "baz",
  }]
}
```

...would yield (when rendering):

```markdown
<i id="foo">baz</i>
```

## License

[MIT](LICENSE) © [Titus Wormer](http://wooorm.com)
