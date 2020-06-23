# remark-vdom

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**remark**][remark] plugin to compile Markdown to [Virtual DOM][vdom].

*   [x] Inherently safe and sanitized: there is no way to pass raw HTML through
*   [x] Supports footnotes, todo lists
*   [x] Support VNode [keys][vnode-key]
*   [x] Custom components overwriting default elements (`MyLink` instead of
    `<a>`)

## Install

[npm][]:

```sh
npm install remark-vdom
```

## Use

Say we have the following file, `example.js`:

```js
var unified = require('unified')
var markdown = require('remark-parse')
var vdom = require('remark-vdom')

unified()
  .use(markdown)
  .use(vdom)
  .process('Some _emphasis_, **importance**, and `code`.', function(err, file) {
    if (err) throw err
    console.dir(file.result, {depth: null})
  })
```

Now, running `node example` yields:

```js
VirtualNode {
  tagName: 'DIV',
  properties: { key: undefined },
  children: [
    VirtualNode {
      tagName: 'P',
      properties: { key: undefined },
      children: [
        VirtualText { text: 'Some ' },
        VirtualNode {
          tagName: 'EM',
          properties: { key: undefined },
          children: [ VirtualText { text: 'emphasis' } ],
          key: 'h-3',
          namespace: null,
          count: 1,
          hasWidgets: false,
          hasThunks: false,
          hooks: undefined,
          descendantHooks: false
        },
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
          descendantHooks: false
        },
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
          descendantHooks: false
        },
        VirtualText { text: '.' }
      ],
      key: 'h-2',
      namespace: null,
      count: 10,
      hasWidgets: false,
      hasThunks: false,
      hooks: undefined,
      descendantHooks: false
    }
  ],
  key: 'h-1',
  namespace: null,
  count: 11,
  hasWidgets: false,
  hasThunks: false,
  hooks: undefined,
  descendantHooks: false
}
```

## API

### `remark().use(vdom[, options])`

Compile Markdown to [Virtual DOM][vdom].

> ℹ️ In [`unified@9.0.0`][unified-9], the result of `.process` changed from
> ~~`file.contents`~~ to `file.result`.

##### `options`

###### `options.sanitize`

How to sanitize the output (`Object` or `boolean`, default: `null`).

Sanitation is done by [`hast-util-sanitize`][sanitize], except when `false` is
given.
If an object is passed in, it’s given as a schema to `sanitize`.
By default, input is sanitized according to [GitHub’s sanitation rules][github].

Embedded HTML is **always** stripped.

For example, by default `className`s are stripped.
To keep them in, use something like:

```js
var merge = require('deepmerge')
var gh = require('hast-util-sanitize/lib/github')

var schema = merge(gh, {attributes: {'*': ['className']}})

var vtree = remark()
  .use(vdom, {sanitize: schema})
  .processSync(/* ... */)
```

###### `options.prefix`

Optimization [hint][] (`string`, default: `h-`).

###### `options.h`

Hyperscript to use (`Function`, default: `require('virtual-dom/h')`).

###### `options.components`

Map of tag names to custom components (`Object.<Function>`, optional).
That component is invoked with `tagName`, `props`, and `children`.
It can return any VDOM compatible value (such as `VNode`, `VText`, `Widget`).
For example:

```js
var components = {code: code}

function code(tagName, props, children) {
  // Ensure a default programming language is set.
  if (!props.className) {
    props.className = 'language-js'
  }

  return h(tagName, props, children)
}
```

## Integrations

Integrates with the same tools as [`remark-html`][remark-html].

## Security

Use of `remark-vdom` is *safe* by default, but changing the `sanitize` option
can open you up to a [cross-site scripting (XSS)][xss] attack if the tree is
unsafe.

## Related

*   [`remark-rehype`](https://github.com/remarkjs/remark-rehype)
    — Properly transform to an HTML virtual DOM (hast)
*   [`rehype-react`](https://github.com/rhysd/rehype-react)
    — Transform hast to React
*   [`remark-react`](https://github.com/mapbox/remark-react)
    — Compile markdown to React
*   [`remark-man`](https://github.com/remarkjs/remark-man)
    — Compile to man pages
*   [`remark-html`][remark-html]
    — Compile to HTML

## Contribute

See [`contributing.md`][contributing] in [`remarkjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/remarkjs/remark-vdom/main.svg

[build]: https://travis-ci.org/remarkjs/remark-vdom

[coverage-badge]: https://img.shields.io/codecov/c/github/remarkjs/remark-vdom.svg

[coverage]: https://codecov.io/github/remarkjs/remark-vdom

[downloads-badge]: https://img.shields.io/npm/dm/remark-vdom.svg

[downloads]: https://www.npmjs.com/package/remark-vdom

[size-badge]: https://img.shields.io/bundlephobia/minzip/remark-vdom.svg

[size]: https://bundlephobia.com/result?p=remark-vdom

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified/remark

[npm]: https://docs.npmjs.com/cli/install

[health]: https://github.com/remarkjs/.github

[contributing]: https://github.com/remarkjs/.github/blob/HEAD/contributing.md

[support]: https://github.com/remarkjs/.github/blob/HEAD/support.md

[coc]: https://github.com/remarkjs/.github/blob/HEAD/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[remark]: https://github.com/remarkjs/remark

[remark-html]: https://github.com/remarkjs/remark-html

[sanitize]: https://github.com/syntax-tree/hast-util-sanitize

[github]: https://github.com/syntax-tree/hast-util-sanitize#schema

[vdom]: https://github.com/Matt-Esch/virtual-dom

[vnode-key]: https://github.com/Matt-Esch/virtual-dom/tree/HEAD/virtual-hyperscript#key

[hint]: https://github.com/Matt-Esch/virtual-dom/tree/HEAD/virtual-hyperscript#key

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[unified-9]: https://github.com/unifiedjs/unified/releases/tag/9.0.0
