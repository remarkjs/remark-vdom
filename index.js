/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:vdom
 * @fileoverview Compile Markdown to VDOM with remark.
 */

'use strict';

/* eslint-env commonjs */

/*
 * Dependencies.
 */

var compilers = require('./lib/compilers');
var transformer = require('./lib/transformer');

/**
 * Attach a VDOM compiler.
 *
 * @param {Unified} processor - Instance.
 * @param {Object?} [options] - Configuration.
 */
function plugin(processor, options) {
    var MarkdownCompiler = processor.Compiler;
    var ancestor = MarkdownCompiler.prototype;
    var proto;
    var key;

    /**
     * Extensible prototype.
     */
    function VDOMCompilerPrototype() {}

    VDOMCompilerPrototype.prototype = ancestor;

    proto = new VDOMCompilerPrototype();

    /**
     * Extensible constructor.
     *
     * @param {VFile} file - Virtual file.
     */
    function VDOMCompiler(file) {
        MarkdownCompiler.apply(this, [file, options]);
    }

    VDOMCompiler.prototype = proto;

    /*
     * Expose compilers.
     */

    for (key in compilers) {
        proto[key] = compilers[key];
    }

    processor.Compiler = VDOMCompiler;

    return transformer;
}

/*
 * Expose `plugin`.
 */

module.exports = plugin;
