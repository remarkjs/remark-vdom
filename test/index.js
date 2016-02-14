/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:vdom:test
 * @fileoverview Test suite for remark-vdom.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var path = require('path');
var fs = require('fs');
var assert = require('assert');
var test = require('tape');
var remark = require('remark');
var yamlConfig = require('remark-yaml-config');
var toc = require('remark-toc');
var github = require('remark-github');
var commentConfig = require('remark-comment-config');
var commonmark = require('commonmark.json');
var toVFile = require('to-vfile');
var h = require('virtual-dom/h');
var vdom2html = require('vdom-to-html');
var vdom = require('..');

/*
 * By default, CommonMark failures are accepted.
 *
 * To fail on CommonMark exceptions, set the `CMARK`
 * environment variable.
 */

var ignoreCommonMarkException = !('CMARK' in global.process.env);

/*
 * Methods.
 */

var read = fs.readFileSync;
var exists = fs.existsSync;
var join = path.join;

/*
 * Constants.
 */

var INTEGRATION_MAP = {
    'github': github,
    'yaml-config': yamlConfig,
    'toc': toc,
    'comment-config': commentConfig
};

var INTEGRATION_ROOT = join(__dirname, 'integrations');
var FIXTURE_ROOT = join(__dirname, 'fixtures');

var CMARK_OPTIONS = {
    'entities': 'escape',
    'commonmark': true,
    'yaml': false,
    'xhtml': true
};

/*
 * Fixtures.
 */

var fixtures = fs.readdirSync(FIXTURE_ROOT);
var integrations = fs.readdirSync(INTEGRATION_ROOT);

/**
 * Check if `filePath` is hidden.
 *
 * @param {string} filePath - Path to file.
 * @return {boolean} - Whether or not `filePath` is hidden.
 */
function isHidden(filePath) {
    return filePath.indexOf('.') !== 0;
}

/*
 * Gather fixtures.
 */

fixtures = fixtures.filter(isHidden);
integrations = integrations.filter(isHidden);

/*
 * CommonMark.
 */

var section;
var start;

commonmark.forEach(function (test, position) {
    if (section !== test.section) {
        section = test.section;
        start = position;
    }

    test.relative = position - start + 1;
});

/**
 * Transform VDOM to HTML.
 *
 * @param {Array.<VNode>} nodes - List of nodes.
 * @return {string} - Stringified HTML.
 */
function wrap(nodes) {
    var result = vdom2html(h('div', nodes));

    return result.slice('<div>'.length, -('</div>'.length));
}

/**
 * Shortcut to process.
 *
 * @param {VFile} file - Virtual file.
 * @param {Object?} [config] - Configuration.
 * @return {string} - Processed `file`.
 */
function process(file, config) {
    return remark.use(vdom, config).process(file, config);
}

/*
 * Tests.
 */

test('remark-html()', function (t) {
    var processor;

    t.equal(typeof vdom, 'function', 'should be a function');

    t.doesNotThrow(function () {
        vdom(remark());
    }, 'should not throw if not passed options');

    t.throws(
        function () {
            remark.use(vdom).stringify({
                'type': 'root',
                'children': [{
                    'value': 'baz'
                }]
            });
        },
        /Expected node, got `\[object Object\]`/,
        'should throw when not given a node'
    );

    processor = remark().use(vdom);

    t.equal(
        wrap(processor.stringify({
            'type': 'alpha'
        })),
        '<div></div>',
        'should stringify unknown nodes #1'
    );

    t.equal(
        wrap(processor.stringify({
            'type': 'alpha',
            'children': [{
                'type': 'strong',
                'children': [{
                    'type': 'text',
                    'value': 'bravo'
                }]
            }]
        })),
        '<div><strong>bravo</strong></div>',
        'should stringify unknown nodes #2'
    );

    t.equal(
        wrap(processor.stringify({
            'type': 'alpha',
            'value': 'bravo',
            'data': {
                'htmlName': 'section',
                'htmlAttributes': {
                    'class': 'charlie'
                }
            }
        })),
        '<section class="charlie">bravo</section>',
        'should stringify unknown nodes #3'
    );

    processor = remark()
        .use(function () {
            return function (ast) {
                ast.children[0].children[0].data = {
                    'htmlAttributes': {
                        'title': 'overwrite'
                    }
                };
            };
        })
        .use(vdom);

    t.equal(
        wrap(processor.process('![hello](example.jpg "overwritten")')),
        '<p><img src="example.jpg" alt="hello" title="overwrite"></p>',
        'should patch and merge attributes'
    );

    processor = remark()
        .use(function () {
            return function (ast) {
                ast.children[0].children[0].data = {
                    'htmlName': 'b'
                };
            };
        })
        .use(vdom);

    t.equal(
        wrap(processor.process('**Bold!**')),
        '<p><b>Bold!</b></p>',
        'should overwrite a tag-name'
    );

    processor = remark()
        .use(function () {
            return function (ast) {
                ast.children[0].data = {
                    'htmlAttributes': {
                        'class': 'foo'
                    }
                };
            };
        })
        .use(vdom);

    t.equal(
        wrap(processor.process('```js\nvar\n```')),
        '<pre><code class="foo language-js">var\n</code></pre>',
        'should NOT overwrite classes on code'
    );

    t.equal(
        wrap(processor.stringify({
            'type': 'alpha',
            'data': {
                'htmlAttributes': {
                    'class': 'foo'
                }
            }
        })),
        '<div class="foo"></div>',
        'should support properties and attributes'
    );

    t.equal(
        wrap(processor.stringify({
            'type': 'alpha',
            'data': {
                'htmlName': 'script',
                'htmlAttributes': {
                    'async': false
                }
            }
        })),
        '<script></script>',
        'should support boolean attributes #1'
    );

    t.equal(
        wrap(processor.stringify({
            'type': 'alpha',
            'data': {
                'htmlName': 'script',
                'htmlAttributes': {
                    'async': true
                }
            }
        })),
        '<script async></script>',
        'should support boolean attributes #2'
    );

    t.equal(
        wrap(processor.stringify({
            'type': 'link',
            'url': 'file.mp3',
            'data': {
                'htmlAttributes': {
                    'download': true
                }
            },
            'children': [{
                'type': 'text',
                'value': 'Click me!'
            }]
        })),
        '<a href="file.mp3" download>Click me!</a>',
        'should support overloaded boolean attributes #1'
    );

    t.equal(
        wrap(processor.stringify({
            'type': 'link',
            'url': 'file.mp3',
            'data': {
                'htmlAttributes': {
                    'download': false
                }
            },
            'children': [{
                'type': 'text',
                'value': 'Click me!'
            }]
        })),
        '<a href="file.mp3">Click me!</a>',
        'should support overloaded boolean attributes #2'
    );

    t.equal(
        wrap(processor.stringify({
            'type': 'link',
            'url': 'file.mp3',
            'data': {
                'htmlAttributes': {
                    'download': 'song.mp3'
                }
            },
            'children': [{
                'type': 'text',
                'value': 'Click me!'
            }]
        })),
        '<a href="file.mp3" download="song.mp3">Click me!</a>',
        'should support overloaded boolean attributes #3'
    );

    t.end();
});

/*
 * Assert fixtures.
 */

test('Fixtures', function (t) {
    fixtures.forEach(function (fixture) {
        var filepath = join(FIXTURE_ROOT, fixture);
        var output = read(join(filepath, 'output.html'), 'utf-8');
        var input = read(join(filepath, 'input.md'), 'utf-8');
        var config = join(filepath, 'config.json');
        var file = toVFile(fixture + '.md');
        var result;

        file.contents = input;

        config = exists(config) ? JSON.parse(read(config, 'utf-8')) : {};
        result = wrap(process(file, config)) + '\n';

        t.equal(result, output, 'should work on `' + fixture + '`');
    });

    t.end();
});

/*
 * Assert CommonMark.
 */

test('CommonMark', function (t) {
    var skips = 0;

    commonmark.forEach(function (test, n) {
        var name = test.section + ' ' + test.relative;
        var file = toVFile(name + '.md');
        var result;
        var message;
        var err;

        file.contents = test.markdown;
        result = wrap(process(file, CMARK_OPTIONS)) + '\n';

        n = n + 1;

        try {
            assert.equal(result, test.html);
        } catch (e) {
            err = e;
        }

        message = '(' + n + ') should work on ' + name;

        if (ignoreCommonMarkException && err) {
            t.skip(message);
            skips++;
        } else {
            t.equal(result, test.html, message);
        }
    });

    t.skip('Total skips: ' + skips);

    t.end();
});

/*
 * Assert integrations.
 */

test('Integrations', function (t) {
    integrations.forEach(function (integration) {
        var filepath = join(INTEGRATION_ROOT, integration);
        var output = read(join(filepath, 'output.html'), 'utf-8');
        var input = read(join(filepath, 'input.md'), 'utf-8');
        var config = join(filepath, 'config.json');
        var file = toVFile(integration + '.md');
        var result;

        file.contents = input;

        config = exists(config) ? JSON.parse(read(config, 'utf-8')) : {};

        result = remark
            .use(vdom, config)
            .use(INTEGRATION_MAP[integration], config)
            .process(file, config);

        t.equal(
            wrap(result) + '\n',
            output,
            'should work on `' + integration + '`'
        );
    });

    t.end();
});
