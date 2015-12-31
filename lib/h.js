/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:vdom:h
 * @fileoverview
 *   Create VDOM nodes. Loosely inspired by
 *   https://github.com/Matt-Esch/virtual-dom/blob/master/
 *   virtual-hyperscript/index.js
 */

'use strict';

/* eslint-env commonjs */

/*
 * Dependencies.
 */

var assign = require('object-assign');
var paramCase = require('param-case');
var VText = require('virtual-dom/vnode/vtext.js');
var hyperscript = require('virtual-dom/h');
var propertyInformation = require('property-information');

/**
 * Compile attributes.
 *
 * @param {Object?} parameters - Map of parameters.
 * @return {string} - HTML attributes.
 */
function toAttributes(parameters) {
    var properties = {};
    var attributes = {};
    var hasAttributes = false;
    var key;
    var name;
    var value;
    var info;

    for (key in parameters) {
        value = parameters[key];
        info = propertyInformation(key) || {};

        if (value !== null && value !== undefined) {
            if (
                (info.boolean && !value) ||
                (info.overloadedBoolean && value === false)
            ) {
                continue;
            }

            name = info.name || paramCase(key);

            if (info.boolean) {
                value = true;
            }

            if (info.mustUseAttribute || !info.name) {
                hasAttributes = true;
                attributes[name] = value;
            } else {
                properties[name] = value;
            }
        }
    }

    if (hasAttributes) {
        properties.attributes = attributes;
    }

    return properties;
}

/**
 * Compile a `node`, in `context`, into HTML.
 *
 * @example
 *   h(compiler, {
 *     'name': 'br',
 *     'attributes': {
 *       'id': 'foo'
 *     }
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   version: '2',
 *   //   tagName: 'BR',
 *   //   properties: {
 *   //     id: 'foo'
 *   //   }
 *   // }
 *
 *   h(compiler, {
 *     'name': 'br'
 *   }, {
 *     'htmlName': 'img'
 *   });
 *   // {
 *   //   type: 'VirtualNode',
 *   //   version: '2',
 *   //   tagName: 'IMG'
 *   // }
 *
 * @param {HTMLCompiler} context - Context compiler.
 * @param {Object?} [defaults] - Default HTML configuration.
 * @param {string?} [defaults.name] - Default tag-name.
 * @param {Object?} [defaults.attributes] - Default Attributes.
 * @param {Array.<string|VNode>?} [defaults.content] - Children.
 * @param {Object?} [data] - Node configuration.
 * @param {string?} [data.htmlName] - Tag-name.
 * @param {Object?} [data.htmlAttributes] - HTML Attributes.
 * @return {VNode} - Virtual node.
 */
function h(context, defaults, data) {
    if (!data) {
        data = {};
    }

    return hyperscript(
        context.encode(data.htmlName || defaults.name),
        toAttributes(assign({}, defaults.attributes, data.htmlAttributes)),
        defaults.content
    );
}

/**
 * Compile a `node`, in `context`, into HTML.
 *
 * @example
 *   h.text('foo')
 *   // {type: 'VirtualText', version: '2', text: 'foo'}
 *
 * @param {string} value - Value to set on text node.
 * @return {VText} - Virtual text node.
 */
function text(value) {
    return new VText(value);
}

/*
 * Expose.
 */

h.text = text;

module.exports = h;
