/**
 * @typedef {import('./index.js').Options} Options
 * @typedef {import('virtual-dom').VNode} VNode
 */

import test from 'tape'
import {remark} from 'remark'
import {h} from 'virtual-dom'
// @ts-expect-error: untyped.
import vdom2html from 'vdom-to-html'
import vdom from './index.js'

test('remark-vdom', (t) => {
  /**
   * @param {string} [fixture]
   * @param {Options} [options]
   */
  function check(fixture, options) {
    return vdom2html(remark().use(vdom, options).processSync(fixture).result)
  }

  t.equal(
    check(),
    '<div></div>',
    'should return an empty `div` without content'
  )

  t.equal(
    check('_Emphasis_, **importance**, and `code`.'),
    '<div><p><em>Emphasis</em>, <strong>importance</strong>, and <code>code</code>.</p></div>',
    'should compile content'
  )

  t.equal(
    check('_Emphasis_!', {
      // @ts-expect-error: TS tripping up, it’s fine.
      h(name, props, children) {
        return h(name === 'EM' ? 'I' : name, props, children)
      }
    }),
    '<div><p><i>Emphasis</i>!</p></div>',
    '`h`'
  )

  t.equal(
    check('_Emphasis_!', {
      sanitize: {tagNames: []}
    }),
    '<div>Emphasis!</div>',
    '`sanitize`'
  )

  t.equal(
    check('_Emphasis_!', {
      sanitize: false
    }),
    '<div><p><em>Emphasis</em>!</p></div>',
    '`sanitize: false`'
  )

  t.equal(
    check('_Emphasis_!', {
      components: {
        em(_, _1, children) {
          return children
        }
      }
    }),
    '<div><p>Emphasis!</p></div>',
    '`components`'
  )

  const node = /** @type {VNode} */ (
    remark().use(vdom, {prefix: 'f-'}).processSync('_Emphasis_!').result
  )

  t.equal(node.key, 'f-1', '`prefix`')

  t.end()
})
