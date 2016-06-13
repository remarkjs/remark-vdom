# remark-vdom [![Build Status][build-badge]][build-status] [![Coverage Status][coverage-badge]][coverage-status] [![Chat][chat-badge]][chat]

<!--lint disable list-item-spacing-->

**remark-vdom** compiles markdown to [Virtual DOM][vdom]. Built on
[**remark**][remark], an extensively tested and pluggable markdown
parser.

*   [x] Inherently safe and sanitized: there is no way to pass raw HTML through.
*   [x] Supports footnotes, todo lists;
*   [ ] Future: support VNode [keys][vnode-key];
*   [ ] Future: allow custom components to overwrite default elements, e.g.,
    `MyLink` instead of `<a>`;
*   [ ] Future: Expose as [widget][].

Note: **remark-vdom** exposes an array of [VNode][]s.  You will
probably need to wrap the result in, for example, an `article` node,
for rendering by virtual-dom.

## Installation

[npm][]:

```bash
npm install remark-vdom
```

**remark-vdom** is also available as an AMD, CommonJS, and
globals module, [uncompressed and compressed][releases].

## Usage

Dependencies:

```javascript
var remark = require('remark');
var vdom = require('remark-vdom');
```

Process:

```javascript
var vdom = remark().use(vdom).process(
    'Some _emphasis_, **strongness**, and `code`.'
).contents;
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

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/wooorm/remark-vdom.svg

[build-status]: https://travis-ci.org/wooorm/remark-vdom

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/remark-vdom.svg

[coverage-status]: https://codecov.io/github/wooorm/remark-vdom

[chat-badge]: https://img.shields.io/gitter/room/wooorm/remark.svg

[chat]: https://gitter.im/wooorm/remark

[releases]: https://github.com/wooorm/remark-vdom/releases

[license]: LICENSE

[author]: http://wooorm.com

[npm]: https://docs.npmjs.com/cli/install

[remark]: https://github.com/wooorm/remark

[mdast]: https://github.com/wooorm/mdast

[vdom]: https://github.com/Matt-Esch/virtual-dom

[vnode-key]: https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript#key

[widget]: https://github.com/Matt-Esch/virtual-dom/blob/903d884a8e4f05f303ec6f2b920a3b5237cf8b92/docs/widget.md

[vnode]: https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript
