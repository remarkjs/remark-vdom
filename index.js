/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:vdom
 * @fileoverview Compile Markdown to VDOM with remark.
 */

'use strict';

/* Dependencies. */
var toHAST = require('mdast-util-to-hast');
var sanitize = require('hast-util-sanitize');
var toH = require('hast-to-hyperscript');
var hyperscript = require('virtual-dom/h');

/* Methods. */
var own = {}.hasOwnProperty;

/**
 * Attach a VDOM compiler.
 *
 * @param {Unified} processor - Instance.
 * @param {Object?} [options]
 * @param {Object?} [options.sanitize]
 *   - Sanitation schema.
 * @param {Object?} [options.components]
 *   - Components.
 * @param {string?} [options.prefix]
 *   - Key prefix.
 * @param {Function?} [options.createElement]
 *   - `h()`.
 */
function plugin(processor, options) {
  var settings = options || {};
  var info = settings.sanitize;
  var clean = info !== false;
  var schema = info && typeof info === 'object' ? info : null;
  var components = settings.components || {};
  var h = settings.h || hyperscript;

  /**
   * Wrapper around `h` to pass components in.
   *
   * @param {string} name - Element name.
   * @param {Object} props - Attributes.
   * @return {VNode} - VDOM element.
   */
  function w(name, props, children) {
    var id = name.toLowerCase();
    var fn = own.call(components, id) ? components[id] : h;
    return fn(name, props, children);
  }

  /**
   * Extensible constructor.
   */
  function Compiler() {}

  /**
   * Wrap `children` in a HAST div.
   *
   * @param {Array.<Node>} children - Nodes.
   * @return {Node} - Div node.
   */
  function div(children) {
    return {
      type: 'element',
      tagName: 'div',
      properties: {},
      children: children
    };
  }

  /**
   * Compile MDAST to VDOM.
   *
   * @param {Node} node - MDAST node.
   * @return {VNode} - VDOM element.
   */
  function compile(node) {
    var hast = div(toHAST(node).children);

    if (clean) {
      hast = sanitize(hast, schema);

      /* If `div` is removed by sanitation, add it back. */
      if (hast.type === 'root') {
        hast = div(hast.children);
      }
    }

    return toH(w, hast, settings.prefix);
  }

  Compiler.prototype.compile = compile;

  processor.Compiler = Compiler;
}

/* Expose `plugin`. */
module.exports = plugin;
