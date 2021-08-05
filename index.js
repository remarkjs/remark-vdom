/**
 * @typedef {import('mdast').Root} MdastRoot
 * @typedef {import('hast').Root} HastRoot
 * @typedef {import('hast').Element} HastElement
 * @typedef {HastRoot|HastRoot['children'][number]} HastNode
 * @typedef {import('virtual-dom').VNode} VNode
 * @typedef {import('virtual-dom').VChild} VChild
 * @typedef {import('virtual-dom').h} H
 * @typedef {import('hast-util-sanitize').Schema} Schema
 *
 * @callback Component
 * @param {string} name
 * @param {Record<string, unknown>} props
 * @param {VNode[]} children
 * @returns {VNode|VNode[]}
 *
 * @typedef Options
 *   Configuration.
 * @property {boolean|Schema|null|undefined} [sanitize]
 *   How to sanitize the output.
 *
 *   Sanitation is done by `hast-util-sanitize`, except when `false` is
 *   given.
 *   If an object is passed in, it’s given as a schema to `sanitize`.
 *   By default, input is sanitized according to GitHub’s sanitation rules.
 *
 *   Embedded HTML is **always** stripped.
 * @property {string|null|undefined} [prefix='h-']
 *   Optimization hint.
 * @property {H|null|undefined} [h]
 *   Hyperscript to use.
 * @property {Record<string, Component>} [components={}]
 *   Map of tag names to custom components.
 *   That component is invoked with `tagName`, `props`, and `children`.
 *   It can return any VDOM compatible value (such as `VNode`, `VText`,
 *   `Widget`).
 */

import {toHast} from 'mdast-util-to-hast'
import {sanitize} from 'hast-util-sanitize'
import {toH} from 'hast-to-hyperscript'
import {h as defaultH} from 'virtual-dom'

const own = {}.hasOwnProperty

/**
 * Plugin to compile Markdown to Virtual DOM.
 *
 * @type {import('unified').Plugin<[Options?]|void[], MdastRoot, VNode>}
 */
export default function remarkVdom(options = {}) {
  const info = options.sanitize
  const clean = info !== false
  const schema = info && typeof info === 'object' ? info : null
  const components = options.components || {}
  const h = options.h || defaultH

  Object.assign(this, {Compiler: compiler})

  /** @type {import('unified').CompilerFunction<MdastRoot, VNode>} */
  function compiler(node) {
    /** @type {HastNode} */
    // @ts-expect-error: assume a root w/o doctypes.
    let hast = div(toHast(node).children)

    if (clean) {
      hast = sanitize(hast, schema || undefined)

      // If `div` is removed by sanitation, add it back.
      if (hast.type === 'root') {
        // @ts-expect-error: assume a root w/o doctypes.
        hast = div(hast.children)
      }
    }

    // @ts-expect-error: assume no doctypes.
    return toH(w, hast, options.prefix)
  }

  /**
   * Wrapper around `h` to pass components in.
   *
   * @param {string} name
   * @param {object} props
   * @param {VChild[]|undefined} children
   * @returns {VNode|VNode[]}
   */
  function w(name, props, children) {
    const id = name.toLowerCase()
    const fn = own.call(components, id) ? components[id] : h
    // @ts-expect-error: vdom types vague.
    return fn(name, props, children || [])
  }

  /**
   * Wrap `children` in a hast div.
   *
   * @param {HastElement['children']} children
   * @returns {HastElement}
   */
  function div(children) {
    return {type: 'element', tagName: 'div', properties: {}, children}
  }
}
