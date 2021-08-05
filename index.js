import {toHast} from 'mdast-util-to-hast'
import {sanitize} from 'hast-util-sanitize'
import {toH} from 'hast-to-hyperscript'
import hyperscript from 'virtual-dom/h.js'

var own = {}.hasOwnProperty

// Attach a VDOM compiler.
export default function remarkVdom(options) {
  var settings = options || {}
  var info = settings.sanitize
  var clean = info !== false
  var schema = info && typeof info === 'object' ? info : null
  var components = settings.components || {}
  var h = settings.h || hyperscript

  this.Compiler = compiler

  // Compile mdast to vdom.
  function compiler(node) {
    var hast = div(toHast(node).children)

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
    var id = name.toLowerCase()
    var fn = own.call(components, id) ? components[id] : h
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
