# remark-vdom [![Build Status][build-badge]][build-status] [![Coverage Status][coverage-badge]][coverage-status] [![Chat][chat-badge]][chat]

**remark-vdom** compiles markdown to [Virtual DOM][vdom].  Built on
[**remark**][remark], an extensively tested and pluggable markdown
parser.

*   [x] Inherently safe and sanitized: there is no way to pass raw HTML through.
*   [x] Supports footnotes, todo lists;
*   [x] Support VNode [keys][vnode-key];
*   [x] Custom components overwriting default elements
    (`MyLink` instead of `<a>`);

## Installation

[npm][]:

```bash
npm install remark-vdom
```

## Usage

```javascript
var remark = require('remark');
var vdom = require('remark-vdom');

var vtree = remark()
  .use(vdom)
  .process('_Emphasis_, **importance**, and `code`.')
  .contents;

console.dir(vtree, {depth: null});
```

Yields (note it’s an array of nodes):

```txt
VirtualNode {
  tagName: 'DIV',
  properties: { key: undefined },
  children:
   [ VirtualNode {
       tagName: 'P',
       properties: { key: undefined },
       children:
        [ VirtualNode {
            tagName: 'EM',
            properties: { key: undefined },
            children: [ VirtualText { text: 'Emphasis' } ],
            key: 'h-3',
            namespace: null,
            count: 1,
            hasWidgets: false,
            hasThunks: false,
            hooks: undefined,
            descendantHooks: false },
          VirtualText { text: ', ' },
          VirtualNode {
            tagName: 'STRONG',
            properties: { key: undefined },
            children: [ VirtualText { text: 'importance' } ],
            key: 'h-4',
            namespace: null,
            count: 1,
            hasWidgets: false,
            hasThunks: false,
            hooks: undefined,
            descendantHooks: false },
          VirtualText { text: ', and ' },
          VirtualNode {
            tagName: 'CODE',
            properties: { key: undefined },
            children: [ VirtualText { text: 'code' } ],
            key: 'h-5',
            namespace: null,
            count: 1,
            hasWidgets: false,
            hasThunks: false,
            hooks: undefined,
            descendantHooks: false },
          VirtualText { text: '.' } ],
       key: 'h-2',
       namespace: null,
       count: 9,
       hasWidgets: false,
       hasThunks: false,
       hooks: undefined,
       descendantHooks: false } ],
  key: 'h-1',
  namespace: null,
  count: 10,
  hasWidgets: false,
  hasThunks: false,
  hooks: undefined,
  descendantHooks: false }
```

## API

### `remark().use(vdom[, options])`

Compiles markdown to [Virtual DOM][vdom].

##### `options`

###### `options.sanitize`

How to sanitise the output (`Object` or `boolean`, default: `null`).

Sanitation is done by [`hast-util-sanitize`][sanitize], except when
`false` is given.  If an object is passed in, it’s given as a schema
to `sanitize`.  By default, input is sanitised according to [GitHub’s
sanitation rules][github].

Embedded HTML is **always** stripped.

For example, by default `className`s are stripped.  To keep them in,
use something like:

```js
var merge = require('deepmerge');
var gh = require('hast-util-sanitize/lib/github');

var schema = merge(gh, {attributes: {'*': ['className']}});

var vtree = remark().use(vdom, {sanitize: schema}).process(/* ... */);
```

###### `options.prefix`

Optimisation [hint][] (`string`, default: `h-`).

###### `options.h`

Hyperscript to use (`Function`, default: `require('virtual-dom/h')`).

###### `options.components`

Map of tag-names to custom components (`Object.<Function>`, optional).
That component is invoked with `tagName`, `props`, and `children`.
It can return any VDOM compatible value (`VNode`, `VText`, `Widget`,
etc.).  For example:

```js
var components = {
  code: function (tagName, props, children) {
    /* Ensure a default programming language is set. */
    if (!props.className) {
      props.className = 'language-js';
    }

    return h(tagName, props, children);
  }
}
```

## Integrations

Integrates with the same tools as [**remark-html**][remark-html].

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/wooorm/remark-vdom.svg

[build-status]: https://travis-ci.org/wooorm/remark-vdom

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/remark-vdom.svg

[coverage-status]: https://codecov.io/github/wooorm/remark-vdom

[chat-badge]: https://img.shields.io/gitter/room/wooorm/remark.svg

[chat]: https://gitter.im/wooorm/remark

[license]: LICENSE

[author]: http://wooorm.com

[npm]: https://docs.npmjs.com/cli/install

[remark]: https://github.com/wooorm/remark

[vdom]: https://github.com/Matt-Esch/virtual-dom

[vnode-key]: https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript#key

[remark-html]: https://github.com/wooorm/remark-html

[hint]: https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript#key

[sanitize]: https://github.com/wooorm/hast-util-sanitize

[github]: https://github.com/wooorm/hast-util-sanitize#schema
