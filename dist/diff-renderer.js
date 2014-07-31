!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.DiffRenderer=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
module.exports = _dereq_('./lib/renderer')

},{"./lib/renderer":9}],2:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule adler32
 */

/* jslint bitwise:true */

"use strict";

var MOD = 65521;

// This is a clean-room implementation of adler32 designed for detecting
// if markup is not what we expect it to be. It does not need to be
// cryptographically strong, only reasonable good at detecting if markup
// generated on the server is different than that on the client.
function adler32(data) {
  var a = 1;
  var b = 0;
  for (var i = 0; i < data.length; i++) {
    a = (a + data.charCodeAt(i)) % MOD;
    b = (b + a) % MOD;
  }
  return a | (b << 16);
}

module.exports = adler32;

},{}],3:[function(_dereq_,module,exports){
'use strict'

/**
 * Dom nodes pool for dom reuse.
 *
 * @api private
 */
function ElementsPool() {
    this.store = {}
}

module.exports = ElementsPool

/**
 * Get a dom element. Create if needed.
 *
 * @param {String} name
 * @return {Node}
 * @api private
 */
ElementsPool.prototype.allocate = function(name) {
    var nodes = this.store[name]
    return nodes && nodes.length ? nodes.shift() : this.createElement(name)
}

/**
 * Release a dom element.
 *
 * @param {Node} element
 * @api private
 */
ElementsPool.prototype.deallocate = function(element) {
    var name = element.nodeName.toLowerCase()
    if (this.store[name]) this.store[name].push(element)
    else this.store[name] = [element]
}

/**
 * Create dom element.
 *
 * @param {String} name - #text, div etc.
 * @return {Element}
 * @api private
 */
ElementsPool.prototype.createElement = function(name) {
    return name == '#text' ? document.createTextNode('') : document.createElement(name)
}

},{}],4:[function(_dereq_,module,exports){
'use strict'

var adler32 = _dereq_('./adler32')

/**
 * Add hashes to every node.
 * Hash is calculated using node name, text, attributes and child nodes.
 *
 * @param {Object} node
 * @return {String} str which is used to generate a hash
 * @api private
 */
module.exports = function hashify(node) {
    var attr, i
    var str = ''
    var nodes

    if (!node) return str

    if (node.name) {
        str += node.name
        if (node.text) str += node.text

        for (attr in node.attributes) {
            str += attr + node.attributes[attr]
        }

        nodes = node.children
    // Its a collection.
    } else {
        nodes = node
    }

    for (i in nodes) {
        str += hashify(nodes[i])
    }

    node.hash = adler32(str)

    return str
}

},{"./adler32":2}],5:[function(_dereq_,module,exports){
'use strict'

/**
 * Find value in json obj using array or dot path notation.
 *
 * http://docs.mongodb.org/manual/core/document/#document-dot-notation
 *
 * {a: {b: {c: 3}}}
 * 'a.b.c' // 3
 *
 * {a: {b: {c: [1,2,3]}}}
 * 'a.b.c.1' // 2
 *
 * @param {Object|Array} obj
 * @param {String|Array} path
 * @return {Mixed}
 */
module.exports = function(obj, path) {
    var parts, i

    if (!obj || !path) return obj

    parts = typeof path == 'string' ? path.split('.') : path

    for (i = 0; i < parts.length; i++) {
        obj = obj[parts[i]]
    }

    return obj
}

},{}],6:[function(_dereq_,module,exports){
'use strict'

var keypath = _dereq_('./keypath')
var Node = _dereq_('./node')

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

},{"./keypath":5,"./node":7}],7:[function(_dereq_,module,exports){
'use strict'

var ElementsPool = _dereq_('./elements-pool')
var queue = _dereq_('./render-queue')

// Global elements pool for all nodes and all renderer instances.
var pool = new ElementsPool()

var counter = 0

var nodesMap = {}

var ID_NAMESPACE = '__diffRendererId__'

/**
 * Abstract node which can be rendered to a dom node.
 *
 * @param {Object} options
 * @param {String} options.name tag name
 * @param {String} [options.text] text for the text node
 * @param {Object} [options.attributes] key value hash of name/values
 * @param {Element} [options.element] if element is passed, node is already rendered
 * @param {Object} [options.children] NodeList like collection
 * @param {Node} [parent]
 * @api private
 */
function Node(options, parent) {
    this.id = counter++
    this.name = options.name
    this.parent = parent
    if (options.text) this.text = options.text
    if (options.attributes) this.attributes = options.attributes
    if (options.element) {
        this.setTarget(options.element)
    // Not dirty if element passed.
    } else {
        this.dirty('name', true)
        if (this.text) this.dirty('text', true)
        if (this.attributes) this.dirty('attributes', this.attributes)
    }

    if (options.children) {
        this.children = []
        for (var i in options.children) {
            if (i != 'length') {
                this.children[i] = Node.create(options.children[i], this)
                if (this.children[i].dirty()) this.dirty('children', true)
            }
        }
    }

    nodesMap[this.id] = this
}

module.exports = Node

/**
 * Create Node instance, check if passed element has already a Node.
 *
 * @see {Node}
 * @api private
 * @return {Node}
 */
Node.create = function(options, parent) {
    if (options.element && options.element[ID_NAMESPACE]) {
        return nodesMap[options.element[ID_NAMESPACE]]
    }
    return new Node(options, parent)
}

/**
 * Serialize instance to json data.
 *
 * @return {Object}
 * @api private
 */
Node.prototype.toJSON = function() {
    var json = {name: this.name}
    if (this.text) json.text = this.text
    if (this.attributes) json.attributes = this.attributes
    if (this.children) {
        json.children = {length: this.children.length}
        for (var i = 0; i < this.children.length; i++) {
            json.children[i] = this.children[i].toJSON()
        }
    }

    return json
}

/**
 * Allocate, setup current target, insert children to the dom.
 *
 * @api private
 */
Node.prototype.render = function() {
    if (!this._dirty) return
    if (this.dirty('name')) {
        if (this.target) this.migrate()
        else this.setTarget(pool.allocate(this.name))
        this.dirty('name', null)
    }

    // Handle children
    if (this.dirty('children') && this.children) {
        var newChildren = []
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i]
            // Children can be dirty for removal or for insertions only.
            // All other changes are handled by the child.render.
            if (child.dirty()) {
                if (child.dirty('remove')) {
                    this.removeChildAt(i)
                    child.dirty('remove', null)
                    delete nodesMap[child.id]
                // Handle insert.
                } else {
                    var next = this.children[i + 1]
                    child.render()
                    this.target.insertBefore(child.target, next && next.target)
                    newChildren.push(child)
                    child.dirty('insert', null)
                    child.dirty('name', null)
                }
            } else {
                newChildren.push(child)
            }
        }
        // We migrate children to the new array because some of them might be removed
        // and if we splice them directly, we will remove wrong elements.
        if (newChildren) this.children = newChildren
        this.dirty('children', null)
    }

    // Handle textContent.
    if (this.dirty('text') && this.text) {
        this.target.textContent = this.text
        this.dirty('text', null)
    }

    // Handle attribtues.
    if (this.dirty('attributes')) {
        var attributes = this.dirty('attributes')
        for (var attrName in attributes) {
            var value = attributes[attrName]
            if (value == null) {
                delete this.attributes[attrName]
                if (this.name != '#text') this.target.removeAttribute(attrName)
            } else {
                if (!this.attributes) this.attributes = {}
                this.attributes[attrName] = value
                this.target.setAttribute(attrName, value)
            }
        }
        this.dirty('attributes', null)
    }
}

/**
 * Remove child DOM element at passed position without removing from children array.
 *
 * @param {Number} position
 * @api private
 */
Node.prototype.removeChildAt = function(position) {
    var child = this.children[position]
    child.detach()
    child.cleanup()
    if (child.children) {
        for (var i = 0; i < child.children.length; i++) {
            child.removeChildAt(i)
        }
    }
    pool.deallocate(child.target)
    child.unlink()
}

/**
 * Migrate target DOM element and its children to a new DOM element.
 * F.e. because tagName changed.
 *
 * @api private
 */
Node.prototype.migrate = function() {
    this.detach()
    this.cleanup()
    var oldTarget = this.target
    this.setTarget(pool.allocate(this.name))

    // Migrate children.
    if (this.name == '#text') {
        this.children = null
    } else {
        this.text = null
        while (oldTarget.hasChildNodes()) {
            this.target.appendChild(oldTarget.removeChild(oldTarget.firstChild))
        }
    }
    pool.deallocate(oldTarget)
    this.dirty('insert', true)
}

/**
 * Remove target DOM element from the render tree.
 *
 * @api private
 */
Node.prototype.detach = function() {
    var parentNode = this.target.parentNode
    if (parentNode) parentNode.removeChild(this.target)
}

/**
 * Clean up everything changed on the target DOM element.
 *
 * @api private
 */
Node.prototype.cleanup = function() {
    if (this.attributes) {
        for (var attrName in this.attributes) this.target.removeAttribute(attrName)
    }
    if (this.text) this.target.textContent = ''
    delete this.target[ID_NAMESPACE]
}

/**
 * Set all child nodes set dirty for removal.
 *
 * @api private
 */
Node.prototype.removeChildren = function() {
    if (!this.children) return

    for (var i = 0; i < this.children.length; i++) {
        this.children[i].dirty('remove', true)
    }

    this.dirty('children', true)
}

/**
 * Set child element as dirty for removal.
 *
 * @param {Node} node
 * @api private
 */
Node.prototype.removeChild = function(child) {
    child.dirty('remove', true)
    this.dirty('children', true)
}

/**
 * Clean up all references for current and child nodes.
 *
 * @api private
 */
Node.prototype.unlink = function() {
    if (this.children) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].unlink()
        }
    }
    delete this.id
    delete this.name
    delete this.text
    delete this.attributes
    delete this.parent
    delete this.children
    delete this.target
    delete this._dirty
}

/**
 * Insert a node at specified position.
 *
 * @param {Number} position
 * @param {Node} node
 * @api private
 */
Node.prototype.insertAt = function(position, node) {
    this.dirty('children', true)
    node.dirty('insert', true)
    if (!this.children) this.children = []
    this.children.splice(position, 0, node)
}

/**
 * Insert a node at the end.
 *
 * @param {Node} node
 * @api private
 */
Node.prototype.append = function(node) {
    var position = this.children ? this.children.length : 0
    this.insertAt(position, node)
}

/**
 * Set nodes attributes.
 *
 * @param {Object} attribtues
 * @api private
 */
Node.prototype.setAttributes = function(attributes) {
    for (var name in attributes) {
        this.setAttribute(name, attributes[name])
    }
}

/**
 * Set nodes attribute.
 *
 * @param {String} name
 * @param {String|Boolean|Null} value, use null to remove
 * @api private
 */
Node.prototype.setAttribute = function(name, value) {
    if (this.attributes && this.attributes[name] == value) return
    var attributes = this.dirty('attributes') || {}
    attributes[name] = value
    this.dirty('attributes', attributes)
}

/**
 * Remove nodes attribute.
 * @param {String} name
 * @api private
 */
Node.prototype.removeAttribute = function(name) {
    if (this.attributes && this.attributes[name] != null) this.setAttribute(name, null)
}

/**
 * Set text content.
 *
 * @param {String} content
 * @api private
 */
Node.prototype.setText = function(text) {
    if (this.name != '#text' || text == this.text) return
    this.dirty('text', true)
    this.text = text
}

/**
 * Element name can't be set, we need to swap out the element.
 *
 * @param {String} name
 * @api private
 */
Node.prototype.setName = function(name) {
    if (name == this.name) return
    this.dirty('name', true)
    this.parent.dirty('children', true)
    this.name = name
}

/**
 * Set target element.
 *
 * @param {Element} element
 * @api private
 */
Node.prototype.setTarget = function(element) {
    element[ID_NAMESPACE] = this.id
    this.target = element
}

/**
 * Get/set/unset a dirty flag, add to render queue.
 *
 * @param {String} name
 * @param {Mixed} [value]
 * @api private
 */
Node.prototype.dirty = function(name, value) {
    // Get flag.
    if (value === undefined) {
        return this._dirty && name ? this._dirty[name] : this._dirty
    }

    // Unset dirty flag.
    if (value === null) {
        if (this._dirty) {
            delete this._dirty[name]
            // If if its not empty object - exist.
            for (name in this._dirty) return
            // For quick check.
            delete this._dirty
        }
    // Set dirty flag.
    } else {
        if (!this._dirty) {
            this._dirty = {}
            // Only enqueue if its the first flag.
            queue.enqueue(this)
        }
        this._dirty[name] = value
    }
}

},{"./elements-pool":3,"./render-queue":8}],8:[function(_dereq_,module,exports){
'use strict'

/**
 * Any changed nodes land here to get considered for rendering.
 *
 * @type {Array}
 * @api private
 */
var queue = module.exports = []

/**
 * Add node to the queue.
 *
 * @param {Node} node
 * @api private
 */
queue.enqueue = function(node) {
    queue.push(node)
}

/**
 * Empty the queue.
 *
 * @param {Node} node
 * @api private
 */
queue.empty = function() {
    queue.splice(0)
}


},{}],9:[function(_dereq_,module,exports){
'use strict'

var docdiff = _dereq_('docdiff')
var keypath = _dereq_('./keypath')
var Node = _dereq_('./node')
var Modifier = _dereq_('./modifier')
var serializeDom = _dereq_('./serialize-dom')
var serializeHtml = _dereq_('./serialize-html')
var renderQueue = _dereq_('./render-queue')
var hashify = _dereq_('./hashify')

/**
 * Renderer constructor.
 *
 * @param {Element} element dom node for serializing and updating.
 * @api public
 */
function Renderer(element) {
    if (!element) throw new TypeError('DOM element required')
    if (!(this instanceof Renderer)) return new Renderer(element)
    this.node = null
    this.modifier = null
    this.refresh(element)
}

module.exports = Renderer

Renderer.serializeDom = serializeDom
Renderer.serializeHtml = serializeHtml
Renderer.keypath = keypath
Renderer.docdiff = docdiff
Renderer.hashify = hashify

/**
 * Start checking render queue and render.
 *
 * @api public
 */
Renderer.start = function() {
    function check() {
        if (!Renderer.running) return
        Renderer.render()
        requestAnimationFrame(check)
    }

    Renderer.running = true
    requestAnimationFrame(check)
}

/**
 * Stop checking render queue and render.
 *
 * @api public
 */
Renderer.stop = function() {
    Renderer.running = false
}

/**
 * Render all queued nodes.
 *
 * @api public
 */
Renderer.render = function() {
    if (!renderQueue.length) return
    for (var i = 0; i < renderQueue.length; i++) {
        renderQueue[i].render()
    }
    renderQueue.empty()

    return this
}

/**
 * Create a snapshot from the dom.
 *
 * @param {Element} [element]
 * @return {Renderer} this
 * @api public
 */
Renderer.prototype.refresh = function(element) {
    if (!element && this.node) element = this.node.target
    if (this.node) this.node.unlink()
    var json = serializeDom(element)
    this.node = Node.create(json)
    this.modifier = new Modifier(this.node)

    return this
}

/**
 * Find changes and apply them to virtual nodes.
 *
 * @param {String} html
 * @return {Renderer} this
 * @api public
 */
Renderer.prototype.update = function(html) {
    var next = serializeHtml(html).children
    // Everything has been removed.
    if (!next) {
        this.node.removeChildren()
        return this
    }
    var current = this.node.toJSON().children || {}
    var diff = docdiff(current, next)
    this.modifier.apply(diff)

    return this
}

},{"./hashify":4,"./keypath":5,"./modifier":6,"./node":7,"./render-queue":8,"./serialize-dom":10,"./serialize-html":11,"docdiff":13}],10:[function(_dereq_,module,exports){
'use strict'

/**
 * Walk through the dom and create a json snapshot.
 *
 * @param {Element} element
 * @return {Object}
 * @api private
 */
module.exports = function serialize(element) {
    var json = {
        name: element.nodeName.toLowerCase(),
        element: element
    }

    if (json.name == '#text') {
        json.text = element.textContent
        return json
    }

    var attr = element.attributes
    if (attr && attr.length) {
        json.attributes = {}
        var attrLength = attr.length
        for (var i = 0; i < attrLength; i++) {
            json.attributes[attr[i].name] = attr[i].value
        }
    }

    var childNodes = element.childNodes
    if (childNodes && childNodes.length) {
        json.children = {length: childNodes.length}
        var childNodesLength = childNodes.length
        for (var i = 0; i < childNodesLength; i++) {
            json.children[i] = serialize(childNodes[i])
        }
    }

    return json
}

},{}],11:[function(_dereq_,module,exports){
'use strict'

/**
 * Simplified html parser. The fastest one written in javascript.
 * It is naive and requires valid html.
 * You might want to validate your html before to pass it here.
 *
 * @param {String} html
 * @param {Object} [parent]
 * @return {Object}
 * @api private
 */
module.exports = function serialize(str, parent) {
    if (!parent) parent = {name: 'root'}
    if (!str) return parent

    var i = 0
    var end = false
    var added = false
    var current
    var isWhite, isSlash, isOpen, isClose
    var inTag = false
    var inTagName = false
    var inAttrName = false
    var inAttrValue = false
    var inCloser = false
    var inClosing = false
    var isQuote, openQuote
    var attrName, attrValue
    var inText = false

    var json = {
        parent: parent,
        name: ''
    }

    while (!end) {
        current = str[i]
        isWhite = current == ' ' || current == '\t' || current == '\r' || current == '\n'
        isSlash = current == '/'
        isOpen = current == '<'
        isClose = current == '>'
        isQuote = current == "'" || current == '"'
        if (isSlash) inClosing = true
        if (isClose) inCloser = false

        if (current == null) {
            end = true
        } else {
            if (inTag) {
                if (inCloser) {
                    delete json.name
                // Tag name
                } else if (inTagName || !json.name) {
                    inTagName = true
                    if ((json.name && isWhite) || isSlash) {
                        inTagName = false
                        if (!json.name) {
                            inCloser = true
                            if (parent.parent) parent = parent.parent
                        }
                    } else if (isClose) {
                        serialize(str.substr(i + 1), inClosing || inCloser ? parent : json)
                        return parent
                    } else if (!isWhite) {
                        json.name += current
                    }
                // Attribute name
                } else if (inAttrName || !attrName) {
                    inAttrName = true
                    if (attrName == null) attrName = ''
                    if (isSlash ||
                        (attrName && isWhite) ||
                        (attrName && current == '=')) {

                        inAttrName = false
                        if (attrName) {
                            if (!json.attributes) json.attributes = {}
                            json.attributes[attrName] = ''
                        }
                    } else if (isClose) {
                        serialize(str.substr(i + 1), inClosing || inCloser ? parent : json)
                        return parent
                    } else if (!isWhite) {
                        attrName += current
                    }
                // Attribute value
                } else if (inAttrValue || attrName) {
                    if (attrValue == null) attrValue = ''

                    if (isQuote) {
                        if (inAttrValue) {
                            if (current == openQuote) {
                                if (attrValue) json.attributes[attrName] = attrValue
                                inAttrValue = false
                                attrName = attrValue = null
                            } else {
                                attrValue += current
                            }
                        } else {
                            inAttrValue = true
                            openQuote = current
                        }
                    } else if (inAttrValue) {
                        attrValue += current
                    }
                }
            } else if (isOpen) {
                if (inText) {
                    serialize(str.substr(i), parent)
                    return parent
                }
                inTag = true
            } else if (isSlash && !inAttrValue) {
                end = true
            } else {
                inText = true
                inTag = false
                if (!json.name) json.name = '#text'
                if (json.text == null) json.text = ''
                json.text += current
            }

            if (json.name && !added) {
                if (!parent.children) parent.children = {length: 0}
                parent.children[parent.children.length] = json
                parent.children.length++
                added = true
            }
        }

        if (isClose) inClosing = false

        ++i
    }

    return parent
}

},{}],12:[function(_dereq_,module,exports){

var utils = _dereq_('./utils');

/**
 * Diff Arrays
 *
 * @param  {Array} one
 * @param  {Array} two
 * @return {Array}     Array with values in one but not in two
 */
var diffArrays = function (one, two) {
  return one.filter(function (val) {
    return two.indexOf(val) === -1;
  });
};

/**
 * Extract Type
 *
 * Returns a function that can be passed to an iterator (forEach) that will
 * correctly update all.primitives and all.documents based on the values it
 * iteraties over
 *
 * @param  {Object} all Object on which primitives/documents will be set
 * @return {Object}     The all object, updated based on the looped values
 */
var extractType = function (all) {
  return function (val) {
    if (utils.isObject(val)) {
      all.primitives = false;
    } else {
      all.documents = false;
    }

    if (Array.isArray(val))
      all.primitives = false;
  }
};

/**
 * ArrayDiff
 *
 * @param  {Array}  original
 * @param  {Array}  now
 * @return {Object}
 */
module.exports = function (original, now) {

  var all = { primitives: true, documents: true };

  original.forEach(extractType(all));
  now.forEach(extractType(all));

  var diff = {
    change: null,
    now: now,
    original: original
  };

  if (all.primitives) {
    diff.change = 'primitiveArray';
    diff.added = diffArrays(now, original);
    diff.removed = diffArrays(original, now);
  } else {
    diff.change = all.documents ? 'documentArray' : 'mixedArray';
  }

  return diff;
};
},{"./utils":14}],13:[function(_dereq_,module,exports){

var arraydiff = _dereq_('./arraydiff');
var utils = _dereq_('./utils');

/**
 * DocDiff
 *
 * @param  {Object} original
 * @param  {Object} now
 * @param  {Array}  path
 * @param  {Array}  changes
 * @return {Array}           Array of changes
 */
module.exports = function docdiff (original, now, path, changes) {
  if (!original || !now)
    return false;

  if (!path)
    path = [];

  if (!changes)
    changes = [];

  var keys = Object.keys(now);
  keys.forEach(function (key) {
    var newVal = now[key];
    var origVal = original[key];

    // Recurse
    if (utils.isObject(newVal) && utils.isObject(origVal)) {
      return docdiff(origVal, newVal, path.concat(key), changes);
    }

    // Array diff
    if (Array.isArray(newVal) && Array.isArray(origVal)) {
      var diff = arraydiff(origVal, newVal);
      return changes.push(new Change(path, key, 'update', diff.change, diff.now,
        diff.original, diff.added, diff.removed));
    }

    // Primitive updates and additions
    if (origVal !== newVal) {
      var type = origVal === undefined ? 'add' : 'update';
      changes.push(new Change(path, key, type, 'primitive', newVal, origVal));
    }
  });

  // Primitve removals
  Object.keys(original).forEach(function (key) {
    if (keys.indexOf(key) === -1)
      changes.push(new Change(path, key, 'remove', 'primitive', null,
        original[key]));
  });

  return changes;
}

/**
 * Change
 *
 * @param {Array}  path
 * @param {String} key
 * @param {String} change
 * @param {String} type
 * @param {Mixed}  now
 * @param {Mixed}  original
 * @param {Array}  added
 * @param {Array}  removed
 */
function Change (path, key, change, type, now, original, added, removed) {
  this.path = path.concat(key);
  this.change = change;
  this.type = type;

  this.values = {};

  if (change !== 'remove')
    this.values.now = now;

  if (change !== 'add')
    this.values.original = original;

  if (type === 'primitiveArray') {
    this.values.added = added;
    this.values.removed = removed;
  }
}

},{"./arraydiff":12,"./utils":14}],14:[function(_dereq_,module,exports){

/**
 * isObject
 *
 * @param  {Mixed}  arg
 * @return {Boolean}     If arg is an object
 */
exports.isObject = function (arg) {
  return typeof arg === 'object' && arg !== null && !Array.isArray(arg);
};

},{}]},{},[1])
(1)
});