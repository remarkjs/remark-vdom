// Dependencies:
var remark = require('remark');
var vdom = require('./index.js');

// Process:
var vdom = remark().use(vdom).process(
    'Some _emphasis_, **strongness**, and `code`.'
).contents;

// Yields (note it’s an array of nodes):
console.log('txt', require('util').inspect(vdom, {'depth': null}));
