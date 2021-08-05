import test from 'tape'
import {remark} from 'remark'
import h from 'virtual-dom/h.js'
import vdom2html from 'vdom-to-html'
import vdom from './index.js'

test('remark-vdom', function (t) {
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
        em(name, props, children) {
          return children
        }
      }
    }),
    '<div><p>Emphasis!</p></div>',
    '`components`'
  )

  var node = remark()
    .use(vdom, {prefix: 'f-'})
    .processSync('_Emphasis_!').result

  t.equal(node.key, 'f-1', '`prefix`')

  t.end()
})
