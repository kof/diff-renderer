'use strict'

var keypath = require('./keypath')
var Node = require('./node')

/**
 * Modifier applies changes to the node.
 *
 * @param {Node} node
 * @api private
 */
function Modifier(node) {
    this.node = node
}

module.exports = Modifier

/**
 * Exclude properties from applying the diff.
 *
 * @type {Object}
 * @api private
 */
Modifier.EXCLUDE = {
    length: true,
    parent: true
}

/**
 * Apply the changes to the node.
 *
 * @param {Array} changes
 * @api private
 */
Modifier.prototype.apply = function(changes) {
    for (var i = 0; i < changes.length; i++) {
        var change = changes[i]
        var prop = change.path[change.path.length - 1]

        if (Modifier.EXCLUDE[prop]) continue

        var propIsNum = false
        if (!isNaN(prop)) {
            propIsNum = true
            prop = Number(prop)
        }

        var method = this[prop]
        if (!method) {
            if (propIsNum) method = this['children']
            else method = this['attributes']
        }
        method.call(this, change, prop)
    }
}

/**
 * Modify a text node.
 *
 * @param {Change} change
 * @param {String} prop
 * @api private
 */
Modifier.prototype.text = function(change, prop) {
    var path = change.path.slice(0, change.path.length - 1)
    var now = change.values.now
    var node = keypath(this.node.children, path)
    node.setText(now)
}

/**
 * Insert/remove child nodes.
 *
 * @param {Change} change
 * @param {String|Number} prop
 * @api private
 */
Modifier.prototype.children = function(change, prop) {
    var now = change.values.now
    var node
    var path

    if (change.change == 'add') {
        // Insert node at specific position.
        if (typeof prop == 'number') {
            // Find a path to the parent node.
            if (change.path.length > 1) {
                path = change.path.slice(0, change.path.length - 1)
                path.push(prop - 1)
                node = keypath(this.node.children, path)
            } else {
                node = this.node
            }
            node.insertAt(prop, Node.create(now, node))
        // Append children.
        } else {
            path = change.path.slice(0, change.path.length - 1)
            node = keypath(this.node.children, path)
            for (var key in now) {
                if (!Modifier.EXCLUDE[key]) node.append(Node.create(now[key], node))
            }
        }
    } else if (change.change == 'remove') {
        // Remove all children.
        if (prop == 'children') {
            path = change.path.slice(0, change.path.length - 1)
            node = keypath(this.node.children, path)
            node.removeChildren()
        } else {
            path = change.path
            node = keypath(this.node.children, path)
            if (node) node.parent.removeChild(node)
        }
    }
}

/**
 * Modify attributes.
 *
 * @param {Change} change
 * @param {String} prop
 * @api private
 */
Modifier.prototype.attributes = function(change, prop) {
    var now = change.values.now
    var path
    var node

    if (change.change == 'add') {
        if (prop == 'attributes') {
            path = change.path.slice(0, change.path.length - 1)
            node = keypath(this.node.children, path)
            node.setAttributes(now)
        } else {
            path = change.path.slice(0, change.path.length - 2)
            node = keypath(this.node.children, path)
            node.setAttribute(prop, now)
        }
    } else if (change.change == 'update') {
        path = change.path.slice(0, change.path.length - 2)
        node = keypath(this.node.children, path)
        node.setAttribute(prop, now)
    } else if (change.change == 'remove') {
        if (prop == 'attributes') {
            path = change.path.slice(0, change.path.length - 1)
            node = keypath(this.node.children, path)
            for (prop in change.values.original) {
                node.removeAttribute(prop)
            }
        } else {
            path = change.path.slice(0, change.path.length - 2)
            node = keypath(this.node.children, path)
            node.removeAttribute(prop)
        }
    }
}

/**
 * Change tag name.
 *
 * @param {Change} change
 * @param {String} prop
 * @api private
 */
Modifier.prototype.name = function(change, prop) {
    var path = change.path.slice(0, change.path.length - 1)
    var node = keypath(this.node.children, path)
    var now = change.values.now
    node.setName(now)
}
