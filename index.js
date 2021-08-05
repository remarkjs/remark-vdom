import {toHast} from 'mdast-util-to-hast'
import {sanitize} from 'hast-util-sanitize'
import {toH} from 'hast-to-hyperscript'
import hyperscript from 'virtual-dom/h.js'

const own = {}.hasOwnProperty

// Attach a VDOM compiler.
export default function remarkVdom(options) {
  const settings = options || {}
  const info = settings.sanitize
  const clean = info !== false
  const schema = info && typeof info === 'object' ? info : null
  const components = settings.components || {}
  const h = settings.h || hyperscript

  this.Compiler = compiler

  // Compile mdast to vdom.
  function compiler(node) {
    let hast = div(toHast(node).children)

    if (clean) {
      hast = sanitize(hast, schema)

      // If `div` is removed by sanitation, add it back.
      if (hast.type === 'root') {
        hast = div(hast.children)
      }
    }

    return toH(w, hast, settings.prefix)
  }

  // Wrapper around `h` to pass components in.
  function w(name, props, children) {
    const id = name.toLowerCase()
    const fn = own.call(components, id) ? components[id] : h
    return fn(name, props, children)
  }

  // Wrap `children` in a hast div.
  function div(children) {
    return {
      type: 'element',
      tagName: 'div',
      properties: {},
      children
    }
  }
}
