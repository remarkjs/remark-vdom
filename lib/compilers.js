/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:vdom:compilers
 * @fileoverview Compilers to transform mdast nodes to VDOM.
 */

'use strict';

/* eslint-env commonjs */

/*
 * Dependencies.
 */

var trim = require('trim');
var detab = require('detab');
var collapse = require('collapse-white-space');
var normalizeURI = require('normalize-uri');
var trimLines = require('trim-lines');
var visit = require('unist-util-visit');
var h = require('./h.js');

var LINE = '\n';

/**
 * Wrap `nodes` with newlines between each entry.
 * Optionally adds newlines at the start and end.
 *
 * @example
 *   wrapInLines(['one', 'two']);
 *   // ['one', '\n', 'two']
 *
 *   wrapInLines(['one', 'two'], true);
 *   // ['\n', 'one', '\n', 'two', '\n']
 *
 *   wrapInLines([], true);
 *   // ['\n']
 *
 * @param {Array.<VNode>} nodes - Nodes to wrap.
 * @param {boolean} loose - Whether to inject newlines at
 *   the start, and end (in case nodes has entries).
 * @return {Array.<VNode>} - Wrapped nodes.
 */
function wrapInLines(nodes, loose) {
    var result = [];
    var index = -1;
    var length = nodes.length;

    if (loose) {
        result.push(h.text(LINE));
    }

    while (++index < length) {
        if (index) {
            result.push(h.text(LINE));
        }

        result.push(nodes[index]);
    }

    if (loose && nodes.length) {
        result.push(h.text(LINE));
    }

    return result;
}

/*
 * Compilers.
 */

var visitors = {};

/**
 * Return the content of a reference without definition
 * as markdown.
 *
 * @example
 *   failsafe({}, {
 *     identifier: 'foo',
 *     referenceType: 'shortcut',
 *     children: [
 *       {
 *         type: 'text',
 *         value: 'foo'
 *       }
 *     ]
 *   });
 *   // [
 *   //   {
 *   //     type: 'VirtualText',
 *   //     text: '['
 *   //   },
 *   //   {
 *   //     type: 'VirtualText',
 *   //     text: 'foo'
 *   //   },
 *   //   {
 *   //     type: 'VirtualText',
 *   //     text: ']'
 *   //   }
 *   // ]
 *
 * @param {VDOMCompiler} context - Instance.
 * @param {Node} node - Node to compile.
 * @param {Node?} [definition] - Definition node, when
 *   existing.
 * @return {Array.<string>?} - If without definition, returns a
 *   string, returns nothing otherwise.
 */
function failsafe(context, node, definition) {
    if (node.referenceType === 'shortcut' && !definition.link) {
        if (node.type === 'imageReference') {
            return ['![' + node.alt + ']'];
        }

        return ['['].concat(context.all(node), ']');
    }
}

/**
 * Stringify all footnote definitions, if any.
 *
 * @example
 *   generateFootnotes();
 *   // [{
 *   //   type: 'VirtualNode',
 *   //   tagName: 'DIV',
 *   //   properties: {
 *   //     attributes: {
 *   //       className:  'footnotes'
 *   //     }
 *   //   },
 *   //   children: [...]
 *   // }]
 *
 * @return {Array.<VNode>} - Compiled footnotes, if any.
 * @this {VDOMCompiler}
 */
function generateFootnotes() {
    var self = this;
    var definitions = self.footnotes;
    var length = definitions.length;
    var index = -1;
    var results = [];
    var def;

    if (!length) {
        return [];
    }

    while (++index < length) {
        def = definitions[index];

        results[index] = self.listItem({
            'type': 'listItem',
            'data': {
                'htmlAttributes': {
                    'id': 'fn-' + def.identifier
                }
            },
            'children': def.children.concat({
                'type': 'link',
                'href': '#fnref-' + def.identifier,
                'data': {
                    'htmlAttributes': {
                        'class': 'footnote-backref'
                    }
                },
                'children': [{
                    'type': 'text',
                    'value': '↩'
                }]
            }),
            'position': def.position
        }, {});
    }

    return [
        h(self, {
            'name': 'div',
            'attributes': {
                'class': 'footnotes'
            },
            'content': wrapInLines([
                h(self, {
                    'name': 'hr'
                }),
                h(self, {
                    'name': 'ol',
                    'content': wrapInLines(results, true)
                })
            ], true)
        }),
        h.text(LINE)
    ];
}

/**
 * Stringify an unknown node.
 *
 * @example
 *   unknown({
 *     data: {
 *       htmlName: 'section'
 *     },
 *     children: [
 *       {
 *         type: 'text',
 *         value: 'foo'
 *       }
 *     ]
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'SECTION',
 *   //   children: [{
 *   //     type: 'VirtualText',
 *   //     text: 'foo'
 *   //   }]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function unknown(node) {
    return h(this, {
        'name': 'div',
        'content': 'children' in node ? this.all(node) : node.value
    }, node.data);
}

/**
 * Visit a node.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.visit({
 *     type: 'strong',
 *     children: [{
 *       type: 'text',
 *       value: 'Foo'
 *     }]
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'STRONG',
 *   //   children: [{
 *   //     type: 'VirtualText',
 *   //     text: 'Foo'
 *   //   }]
 *   // }
 *
 * @param {Object} node - Node.
 * @param {Object?} [parent] - `node`s parent.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 * @throws {Error} - When `node` is not an MDAST node.
 */
function one(node, parent) {
    var self = this;
    var type = node && node.type;
    var fn = typeof self[type] === 'function' ? type : 'unknown';

    if (!type) {
        self.file.fail('Expected node, got `' + node + '`');
    }

    return self[fn](node, parent);
}

/**
 * Stringify the children of `parent`.
 *
 * @example
 *   all({
 *     children: [
 *       {
 *         type: 'text',
 *         value: 'foo'
 *       }
 *     ]
 *   });
 *   // [{
 *   //   type: 'VirtualText',
 *   //   text: 'foo'
 *   // }]
 *
 * @param {Node} parent - Parent to visit.
 * @return {Array.<VNode>} - Virtual nodes.
 * @this {VDOMCompiler}
 */
function all(parent) {
    var self = this;
    var nodes = parent.children;
    var values = [];
    var index = -1;
    var length = nodes.length;
    var value;
    var prev;

    while (++index < length) {
        value = self.visit(nodes[index], parent);

        if (value) {
            if (prev && prev.type === 'break') {
                if (value.text) {
                    value.text = trim.left(value.text);
                } else if (
                    value.children &&
                    value.children[0] &&
                    value.children[0].text
                ) {
                    value.children[0].text = trim.left(value.children[0].text);
                }
            }

            values = values.concat(value);
        }

        prev = nodes[index];
    }

    return values;
}

/**
 * Stringify a root object.
 *
 * @example
 *   // This will additionally include defined footnotes,
 *   // when applicable.
 *   root({
 *     children: [
 *       {
 *         type: 'paragraph',
 *         children: [
 *           {
 *             type: 'text',
 *             value: 'foo'
 *           }
 *         ]
 *       }
 *     ]
 *   });
 *   // [
 *   //   {
 *   //     type: 'VirtualNode',
 *   //     tagName: 'P',
 *   //     children: [
 *   //       {
 *   //         type: 'VirtualText',
 *   //         text: 'foo'
 *   //       }
 *   //     ]
 *   //   },
 *   //   {
 *   //     type: 'VirtualText',
 *   //     text: '\n'
 *   //   }
 *   // ]
 *
 * @param {Node} node - Node to compile.
 * @return {Array.<VNode>} - Virtual nodes.
 * @this {VDOMCompiler}
 */
function root(node) {
    var self = this;
    var definitions = {};
    var footnotes = [];
    var result;

    self.definitions = definitions;
    self.footnotes = footnotes;

    visit(node, 'definition', function (definition) {
        definitions[definition.identifier.toUpperCase()] = definition;
    });

    visit(node, 'footnoteDefinition', function (definition) {
        footnotes.push(definition);
    });

    result = wrapInLines(self.all(node));

    if (result.length) {
        result.push(h.text(LINE));
    }

    return result.concat(self.generateFootnotes());
}

/**
 * Stringify a block quote.
 *
 * @example
 *   blockquote({
 *     children: [
 *       {
 *         type: 'paragraph',
 *         children: [
 *           {
 *             type: 'text',
 *             value: 'foo'
 *           }
 *         ]
 *       }
 *     ]
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'BLOCKQUOTE',
 *   //   children: [
 *   //     {
 *   //       type: 'VirtualText',
 *   //       text: '\n'
 *   //     },
 *   //     {
 *   //       type: 'VirtualNode',
 *   //       tagName: 'P',
 *   //       children: [{
 *   //         type: 'VirtualText',
 *   //         text: 'foo'
 *   //       }]
 *   //     },
 *   //     {
 *   //       type: 'VirtualText',
 *   //       text: '\n'
 *   //     }
 *   //   ]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function blockquote(node) {
    return h(this, {
        'name': 'blockquote',
        'content': wrapInLines(this.all(node), true)
    }, node.data);
}

/**
 * Stringify an inline footnote.
 *
 * @example
 *   // This additionally adds a definition at the bottem
 *   // of the document.
 *   footnote({
 *     children: [
 *       {
 *         type: 'text',
 *         value: 'foo'
 *       }
 *     ]
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'SUP',
 *   //   parameters: {
 *   //      id: 'fnref-1'
 *   //   },
 *   //   children: [...]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function footnote(node) {
    var self = this;
    var definitions = self.footnotes;
    var index = -1;
    var length = definitions.length;
    var identifiers = [];
    var identifier;

    while (++index < length) {
        identifiers[index] = definitions[index].identifier;
    }

    index = -1;
    identifier = 1;

    while (identifiers.indexOf(String(identifier)) !== -1) {
        identifier++;
    }

    identifier = String(identifier);

    self.footnotes.push({
        'type': 'footnoteDefinition',
        'identifier': identifier,
        'children': node.children,
        'position': node.position
    });

    return self.footnoteReference({
        'type': 'footnoteReference',
        'identifier': identifier,
        'position': node.position
    });
}

/**
 * Stringify a list.
 *
 * @example
 *   list({
 *     ordered: true
 *     loose: false
 *     children: [
 *       {
 *         type: 'listItem',
 *         children: [
 *           {
 *             type: 'paragraph',
 *             children: [
 *               {
 *                 type: 'text',
 *                 value: 'foo'
 *               }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'OL',
 *   //   children: [
 *   //     {
 *   //       type: 'VirtualText',
 *   //       text: '\n'
 *   //     },
 *   //     {
 *   //       type: 'VirtualNode',
 *   //       tagName: 'LI',
 *   //       children: [{
 *   //         type: 'VirtualText',
 *   //         text: 'foo'
 *   //       }]
 *   //     },
 *   //     {
 *   //       type: 'VirtualText',
 *   //       text: '\n'
 *   //     }
 *   //   ]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function list(node) {
    return h(this, {
        'name': node.ordered ? 'ol' : 'ul',
        'attributes': {
            'start': node.start !== 1 ? node.start : null
        },
        'content': wrapInLines(this.all(node), true)
    }, node.data);
}

/**
 * Stringify a list-item.
 *
 * @example
 *   listItem({
 *     children: [
 *       {
 *         type: 'paragraph',
 *         children: [
 *           {
 *             type: 'text',
 *             value: 'foo'
 *           }
 *         ]
 *       }
 *     ]
 *   }, {
 *     loose: false
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'LI',
 *   //   children: [{
 *   //     type: 'VirtualText',
 *   //     text: 'foo'
 *   //   }]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @param {Node} parent - Parent of `node`.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function listItem(node, parent) {
    var self = this;
    var result;
    var hasChild = node.children.length === 1 && node.children[0].children;
    var single = !parent.loose && hasChild;

    result = self.all(single ? node.children[0] : node);

    if (node.checked === true || node.checked === false) {
        if (!single && result[0].tagName !== 'P') {
            result.unshift(h(self, {
                'name': 'p'
            }));
        }

        (single ? result : result[0].children).unshift(h(self, {
            'name': 'input',
            'attributes': {
                'type': 'checkbox',
                'checked': node.checked,
                'disabled': true
            }
        }), h.text(' '));
    }

    result = single ? result : wrapInLines(result, true);

    return h(self, {
        'name': 'li',
        'content': result
    }, node.data);
}

/**
 * Stringify a heading.
 *
 * @example
 *   heading({
 *     depth: 3,
 *     children: [
 *       {
 *         type: 'text',
 *         value: 'foo'
 *       }
 *     ]
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'H3',
 *   //   children: [{
 *   //     type: 'VirtualText',
 *   //     text: 'foo'
 *   //   }]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function heading(node) {
    return h(this, {
        'name': 'h' + node.depth,
        'content': this.all(node)
    }, node.data);
}

/**
 * Stringify a paragraph.
 *
 * @example
 *   paragraph({
 *     children: [
 *       {
 *         type: 'text',
 *         value: 'foo'
 *       }
 *     ]
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'P',
 *   //   children: [{
 *   //     type: 'VirtualText',
 *   //     text: 'foo'
 *   //   }]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function paragraph(node) {
    return h(this, {
        'name': 'p',
        'content': this.all(node)
    }, node.data);
}

/**
 * Stringify a code block.
 *
 * @example
 *   code({
 *     value: 'foo &amp; bar'
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'PRE',
 *   //   children: [{
 *   //     type: 'VirtualNode',
 *   //     tagName: 'PRE',
 *   //     children: [{
 *   //       type: 'VirtualText',
 *   //       text: 'foo &amp; bar'
 *   //     }]
 *   //   }]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function code(node) {
    var self = this;
    var value = node.value ? detab(node.value + LINE) : '';

    return h(self, {
        'name': 'pre',
        'content': h(self, {
            'name': 'code',
            'content': value
        }, node.data)
    });
}

/**
 * Stringify a table.
 *
 * @example
 *   table({
 *     children: [
 *       {
 *         type: 'tableRow',
 *         ...
 *       }
 *     ]
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'TABLE',
 *   //   children: [...]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function table(node) {
    var self = this;
    var rows = node.children;
    var index = rows.length;
    var align = node.align;
    var alignLength = align.length;
    var pos;
    var result = [];
    var row;
    var out;
    var name;
    var cell;

    while (index--) {
        pos = alignLength;
        row = rows[index].children;
        out = [];
        name = index === 0 ? 'th' : 'td';

        while (pos--) {
            cell = row[pos];
            out[pos] = h(self, {
                'name': name,
                'attributes': {
                    'align': align[pos]
                },
                'content': cell ? wrapInLines(self.all(cell)) : []
            }, cell && cell.data);
        }

        result[index] = h(self, {
            'name': 'tr',
            'content': wrapInLines(out, true)
        }, rows[index]);
    }

    return h(self, {
        'name': 'table',
        'content': wrapInLines([
            h(self, {
                'name': 'thead',
                'content': wrapInLines([result[0]], true)
            }),
            h(self, {
                'name': 'tbody',
                'content': wrapInLines(result.slice(1), true)
            })
        ], true)
    }, node.data);
}

/**
 * Stringify literal HTML.
 * Does not in fact expose HTML, as that would be
 * dangerous, instead, creates a text node.
 *
 * @example
 *   html({
 *     value: '<i>italic</i>'
 *   });
 *   // {
 *   //   type: 'VirtualText',
 *   //   text: '<i>italic</i>'
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VText} - Virtual text node.
 * @this {VDOMCompiler}
 */
function html(node) {
    return h.text(node.value);
}

/**
 * Stringify a horizontal rule.
 *
 * @example
 *   rule({});
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'HR'
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function rule(node) {
    return h(this, {
        'name': 'hr'
    }, node.data);
}

/**
 * Stringify inline code.
 *
 * @example
 *   inlineCode({
 *     value: 'foo &amp; bar'
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'CODE',
 *   //   children: [{
 *   //     type: 'VirtualText',
 *   //     text: 'foo &amp; bar'
 *   //   }]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function inlineCode(node) {
    return h(this, {
        'name': 'code',
        'content': collapse(node.value)
    }, node.data);
}

/**
 * Stringify strongly emphasised content.
 *
 * @example
 *   strong({
 *     children: [
 *       {
 *         type: 'text',
 *         value: 'foo'
 *       }
 *     ]
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'STRONG',
 *   //   children: [{
 *   //     type: 'VirtualText',
 *   //     text: 'foo'
 *   //   }]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function strong(node) {
    return h(this, {
        'name': 'strong',
        'content': this.all(node)
    }, node.data);
}

/**
 * Stringify emphasised content.
 *
 * @example
 *   emphasis({
 *     children: [{
 *       type: 'text',
 *       value: 'foo'
 *     }]
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'EM',
 *   //   children: [{
 *   //     type: 'VirtualText',
 *   //     text: 'foo'
 *   //   }]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function emphasis(node) {
    return h(this, {
        'name': 'em',
        'content': this.all(node)
    }, node.data);
}

/**
 * Stringify an inline break.
 *
 * @example
 *   hardBreak({});
 *   // [
 *   //   {
 *   //     type: 'VirtualNode',
 *   //     tagName: 'BR'
 *   //   },
 *   //   {
 *   //     type: 'VirtualText',
 *   //     text: '\n'
 *   //   }
 *   // ]
 *
 * @param {Node} node - Node to compile.
 * @return {Array.<VNode>} - Compiled nodes.
 * @this {VDOMCompiler}
 */
function hardBreak(node) {
    return [
        h(this, {
            'name': 'br'
        }, node.data),
        h.text(LINE)
    ];
}

/**
 * Stringify a link.
 *
 * @example
 *   link({
 *     href: 'http://example.com',
 *     children: [{
 *       type: 'text',
 *       value: 'foo'
 *     }]
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'A',
 *   //   properties: {
 *   //     href: 'http://example.com'
 *   //   },
 *   //   children: [{
 *   //     type: 'VirtualText',
 *   //     text: 'foo'
 *   //   }]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function link(node) {
    var self = this;

    return h(self, {
        'name': 'a',
        'attributes': {
            'href': normalizeURI(node.href),
            'title': node.title
        },
        'content': self.all(node)
    }, node.data);
}

/**
 * Stringify a reference to a footnote.
 *
 * @example
 *   // If a definition was added previously:
 *   footnoteReference({
 *     identifier: 'foo'
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'SUP',
 *   //   properties: {
 *   //     id: 'fnref-foo'
 *   //   },
 *   //   children: [...]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function footnoteReference(node) {
    var self = this;
    var identifier = node.identifier;

    return h(self, {
        'name': 'sup',
        'attributes': {
            'id': 'fnref-' + identifier
        },
        'content': [
            h(self, {
                'name': 'a',
                'attributes': {
                    'href': '#fn-' + identifier,
                    'class': 'footnote-ref'
                },
                'content': identifier
            })
        ]
    }, node.data);
}

/**
 * Stringify a reference to a link.
 *
 * @example
 *   // If a definition was added previously:
 *   linkReference({
 *     identifier: 'foo'
 *     children: [{type: 'text', value: 'foo'}]
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'A',
 *   //   properties: {
 *   //     href: 'http://example.com/'
 *   //   },
 *   //   children: [{
 *   //     type: 'VirtualText',
 *   //     text: 'foo'
 *   //   }]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function linkReference(node) {
    var self = this;
    var def = self.definitions[node.identifier.toUpperCase()] || {};

    return failsafe(self, node, def) || h(self, {
        'name': 'a',
        'attributes': {
            'href': normalizeURI(def.link || ''),
            'title': def.title
        },
        'content': self.all(node)
    }, node.data);
}

/**
 * Stringify a reference to an image.
 *
 * @example
 *   // If a definition was added previously:
 *   imageReference({
 *     identifier: 'foo'
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'IMG',
 *   //   properties: {
 *   //     src: 'http://example.com/fav.ico',
 *   //     alt: ''
 *   //   }
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function imageReference(node) {
    var self = this;
    var def = self.definitions[node.identifier.toUpperCase()] || {};

    return failsafe(self, node, def) || h(self, {
        'name': 'img',
        'attributes': {
            'src': normalizeURI(def.link || ''),
            'alt': node.alt || '',
            'title': def.title
        }
    }, node.data);
}

/**
 * Stringify an image.
 *
 * @example
 *   image({
 *     src: 'http://example.com/fav.ico'
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'IMG',
 *   //   properties: {
 *   //     src: 'http://example.com/fav.ico',
 *   //     alt: ''
 *   //   }
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function image(node) {
    return h(this, {
        'name': 'img',
        'attributes': {
            'src': normalizeURI(node.src),
            'alt': node.alt || '',
            'title': node.title
        }
    }, node.data);
}

/**
 * Stringify a deletion.
 *
 * @example
 *   strikethrough({
 *     children: [
 *       {
 *         type: 'text',
 *         value: 'foo'
 *       }
 *     ]
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   tagName: 'DEL',
 *   //   children: [{type: 'VirtualText', text: 'foo'}]
 *   // }
 *
 * @param {Node} node - Node to compile.
 * @return {VNode} - Virtual node.
 * @this {VDOMCompiler}
 */
function strikethrough(node) {
    var self = this;

    return h(self, {
        'name': 'del',
        'content': self.all(node)
    }, node.data);
}

/**
 * Stringify text.
 *
 * @example
 *   text({value: 'foo'}); // {type: 'VirtualText', text: 'foo'}
 *
 * @param {Node} node - Node to compile.
 * @return {VText} - Virtual text node.
 * @this {VDOMCompiler}
 */
function text(node) {
    return h.text(trimLines(node.value));
}

/**
 * Return an void node for nodes which are ignored.
 *
 * @example
 *   ignore(); // null
 *
 * @return {null} - Nothing.
 * @this {VDOMCompiler}
 */
function ignore() {
    return null;
}

/*
 * Helpers.
 */

visitors.visit = one;
visitors.all = all;
visitors.unknown = unknown;
visitors.generateFootnotes = generateFootnotes;

/*
 * Ignored nodes.
 */

visitors.yaml = ignore;
visitors.definition = ignore;
visitors.footnoteDefinition = ignore;

/*
 * Compilers.
 */

visitors.footnote = footnote;
visitors.root = root;
visitors.blockquote = blockquote;
visitors.list = list;
visitors.listItem = listItem;
visitors.paragraph = paragraph;
visitors.heading = heading;
visitors.table = table;
visitors.code = code;
visitors.html = html;
visitors.horizontalRule = rule;
visitors.inlineCode = inlineCode;
visitors.strong = strong;
visitors.emphasis = emphasis;
visitors.break = hardBreak;
visitors.link = link;
visitors.image = image;
visitors.footnoteReference = footnoteReference;
visitors.linkReference = linkReference;
visitors.imageReference = imageReference;
visitors.delete = strikethrough;
visitors.text = text;

/*
 * Expose.
 */

module.exports = visitors;
