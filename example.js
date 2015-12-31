var remark = require('remark');
var vdom = require('./index.js');

var doc = remark().use(vdom).process(
    'Some _emphasis_, **strongness**, and `code`.'
);

// Yields (note it’s an array of nodes):
console.log('txt', require('util').inspect(doc, {'depth': null}));
