'use strict';

var toHAST = require('mdast-util-to-hast');
var sanitize = require('hast-util-sanitize');
var toH = require('hast-to-hyperscript');
var hyperscript = require('virtual-dom/h');
var has = require('has');

module.exports = plugin;

/* Attach a VDOM compiler. */
function plugin(options) {
  var settings = options || {};
  var info = settings.sanitize;
  var clean = info !== false;
  var schema = info && typeof info === 'object' ? info : null;
  var components = settings.components || {};
  var h = settings.h || hyperscript;

  this.Compiler = compiler;

  return;

  /* Compile MDAST to VDOM. */
  function compiler(node) {
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

  /* Wrapper around `h` to pass components in. */
  function w(name, props, children) {
    var id = name.toLowerCase();
    var fn = has(components, id) ? components[id] : h;
    return fn(name, props, children);
  }

  /* Wrap `children` in a HAST div. */
  function div(children) {
    return {
      type: 'element',
      tagName: 'div',
      properties: {},
      children: children
    };
  }
}
