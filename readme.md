# remark-vdom [![Build Status][travis-badge]][travis] [![Coverage Status][codecov-badge]][codecov]

**remark-vdom** compiles markdown to [Virtual DOM][vdom]. Built on
[**remark**][remark], an extensively tested and pluggable markdown
parser.

*   [x] Inherently safe and sanitized: there is no way to pass raw HTML through.

*   [x] Supports footnotes, todo lists;

*   [ ] Future: support VNode [keys][vnode-key].

*   [ ] Future: allow custom components to overwrite default elements, e.g.,
    `MyLink` instead of `<a>`.

*   [ ] Future: Expose as [widget][widget]

Note: **remark-vdom** exposes an array of [VNode][vnode]s. You will
probably need to wrap the result in, for example, an `article` node,
for rendering by virtual-dom.

## Installation

[npm][npm-install]:

```bash
npm install remark-vdom
```

**remark-vdom** is also available as an AMD, CommonJS, and globals
module, [uncompressed and compressed][releases].

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
    descendantHooks: false } ]
```

## API

### `remark.use(vdom)`

Compiles markdown to [Virtual DOM][vdom].

## Integrations

All [**mdast** nodes][mdast] can be compiled to HTML. Unknown **mdast**
nodes are compiled to `div` nodes.

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
