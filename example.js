// Dependencies:
var remark = require('remark');
var vdom = require('./index.js');

// Process:
var vtree = remark()
  .use(vdom)
  .process('_Emphasis_, **importance**, and `code`.')
  .contents;

// Yields (note it’s an array of nodes):
console.log('txt', require('util').inspect(vtree, {depth: null}));
