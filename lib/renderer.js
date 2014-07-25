'use strict'

var docdiff = require('docdiff')
var keypath = require('./keypath')
var serializeDom = require('./serialize-dom')
var serializeHtml = require('./serialize-html')

var createTextNode = document.createTextNode.bind(document)
var createElement = document.createElement.bind(document)

/**
 * Renderer constructor.
 *
 * @param {Element} el dom node for serializing and updating.
 * @api public
 */
function Renderer(el) {
    if (!(this instanceof Renderer)) return new Renderer(el)
    this.el = el
    this.tree = null
    this.serialize()
}

module.exports = Renderer

Renderer.serializeDom = serializeDom
Renderer.serializeHtml = serializeHtml
Renderer.keypath = keypath
Renderer.docdiff = docdiff

/**
 * Properties we don't need to apply to the dom from the diff.
 *
 * @type {Object}
 * @api public
 */
Renderer.IGNORE_PROPERTIES = {
    parent: true,
    node: true,
    outerHtml: true,
    length: true
}

/**
 * Read DOM state.
 *
 * @return {Object} state
 * @api public
 */
Renderer.prototype.serialize = function() {
    return this.tree = serializeDom(this.el).children
}

/**
 * Render changes to DOM.
 *
 * @param {String} html
 * @return {Renderer} this
 * @api public
 */
Renderer.prototype.render = function(html) {
    // this.el is empty, nothing to diff.
    // TODO use nodes pool
    if (!this.tree) {
        this.el.innerHTML = html
        this.serialize()
        return this
    }

    var newTree = serializeHtml(html).children
    this.decycle(newTree)
    var changes = docdiff(this.tree, newTree)
    for (var i = 0; i < changes.length; i++) {
        this.apply(changes[i], newTree)
    }
    this.tree = newTree

    return this
}

/**
 * Remove circular dependencies from the node or nodes list.
 *
 * @param {Object} obj
 * @api private
 */
Renderer.prototype.decycle = function(obj) {
    if (obj.length) {
        for (var key in obj) this.decycle(obj[key])
    } else {
        delete obj.parent
        delete obj.node
        if (obj.children) this.decycle(obj.children)
    }
}

/**
 * Apply change to the dom.
 *
 * @param {Object} change
 * @param {Object} newTree
 * @api private
 */
Renderer.prototype.apply = function(change, newTree) {
    var prop = change.path[change.path.length - 1]
    var propIsNum = !isNaN(prop)
    var pos
    var itemPath, item, newNode
    var key
    var now = change.values.now

    if (Renderer.IGNORE_PROPERTIES[prop]) return

    // Change text node
    if (prop == 'text') {
        itemPath = change.path.slice(0, change.path.length - 1)
        item = keypath(this.tree, itemPath)
        item.node.textContent = now
    // Create node/nodes
    } else if (prop == 'children' || propIsNum) {
        if (change.change == 'add') {
            // Insert node at specific position.
            if (propIsNum) {
                itemPath = change.path.slice(0, change.path.length - 1)
                // Add prev node to the path.
                itemPath.push(prop - 1)
                item = keypath(this.tree, itemPath)
                // In case current change is based on previous change, previous
                // of the same iteration, previous change is not applied to the
                // current tree yet.
                if (!item) item = keypath(newTree, itemPath)

                newNode = this.createNode(now.name, now.text, now.attributes)
                this.insertAfter(item.node, newNode)

                // Link the node in the new tree.
                keypath(newTree, change.path).node = newNode
            // Append children.
            } else {
                itemPath = change.path.slice(0, change.path.length - 1)
                item = keypath(this.tree, itemPath)
                for (key in now) {
                    if (key != 'length') {
                        item.node.appendChild(
                            this.createNode(
                                now[key].name,
                                now[key].text,
                                now[key].attributes
                            )
                        )
                    }
                }
            }
        } else if (change.change == 'remove') {
            this.removeNode(change.values.original.node)
        }
    // Change/add attributes
    } else {
        if (change.change == 'update' || change.change == 'add') {
            itemPath = change.path.slice(0, change.path.length - 2)
            item = keypath(this.tree, itemPath)
            item.node.setAttribute(prop, now)
        } else if (change.change == 'remove') {
            itemPath = change.path.slice(0, change.path.length - 1)
            item = keypath(this.tree, itemPath)
            for (prop in change.values.original) {
                item.node.removeAttribute(prop)
            }
        }
    }
}

/**
 * Create dom element.
 *
 * @param {String} name - #text, div etc.
 * @param {String} [text] text for text node
 * @param {Object} [attrs] node attributes
 * @return {Element}
 * @api private
 */
Renderer.prototype.createNode = function(name, text, attrs) {
    var el = name == '#text' ? createTextNode(text) : createElement(name)

    for (var attr in attrs) el.setAttribute(attr, attrs[attr])

    return el
}

/**
 * Insert a dom node after a node.
 *
 * @param {Node} prev
 * @param {Node} node
 * @api private
 */
Renderer.prototype.insertAfter = function(prev, node) {
    prev.parentNode.insertBefore(node, prev.nextSibling)
}

/**
 * Remove a dom node
 *
 * @param {Node} node
 * @api private
 */
Renderer.prototype.removeNode = function(node) {
    node.parentNode.removeChild(node)
}
