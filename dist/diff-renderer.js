!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.DiffRenderer=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
module.exports = _dereq_('./lib/renderer')

},{"./lib/renderer":7}],2:[function(_dereq_,module,exports){
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

},{}],3:[function(_dereq_,module,exports){
'use strict'

/**
 * Find value in json obj using dots path notation.
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

},{}],4:[function(_dereq_,module,exports){
'use strict'

var keypath = _dereq_('./keypath')
var Node = _dereq_('./node')

/**
 * Modifier applies the diff to the node.
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
    console.log(change, path, this.node)
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
            node.insertAt(prop, new Node(now, node))
        // Append children.
        } else {
            path = change.path.slice(0, change.path.length - 1)
            node = keypath(this.tree, path)
            for (var key in now) {
                if (key != 'length') {
                    node.node.appendChild(
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

    if (change.change == 'update' || change.change == 'add') {
        var path = change.path.slice(0, change.path.length - 2)
        var node = keypath(this.node.children, path)
        node.setAttribute(prop, now)
    } else if (change.change == 'remove') {
        var path = change.path.slice(0, change.path.length - 1)
        var node = keypath(this.node.children, path)
        for (prop in change.values.original) {
            node.setAttribute(prop, null)
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

},{"./keypath":3,"./node":5}],5:[function(_dereq_,module,exports){
'use strict'

var ElementsPool = _dereq_('./elements-pool')
var renderQueue = _dereq_('./render-queue')

// Global elements pool for all nodes and all renderer instances.
var pool = new ElementsPool()

/**
 * Abstract node which can be rendered to a dom node.
 *
 * @param {Object} options
 * @param {String} options.name
 * @param {String} [options.text]
 * @param {Object} [options.attributes]
 * @param {Element} [options.element] if element is passed, node is already rendered
 * @param {Object} [options.children]
 * @param {Node} [parent]
 * @api private
 */
function Node(options, parent) {
    this.name = options.name
    if (options.text) this.text = options.text
    if (options.attributes) this.attributes = options.attributes
    if (options.element) this.target = options.element
    this.parent = parent

    // Not dirty if element passed.
    if (options.element) {
        this.dirty = null
    } else {
        this.dirty = {
            insert: true,
            text: true,
            attributes: true,
            name: true
        }
    }

    if (options.children) {
        this.children = []
        for (var i in options.children) {
            if (i != 'length') this.children[i] = new Node(options.children[i], this)
        }
        if (this.dirty) this.dirty.children = true
    }
}

module.exports = Node

/**
 * Serialize instance to json data.
 *
 * @return {Object}
 * @api private
 */
Node.prototype.toJson = function() {
    var json = {name: this.name}
    if (this.text) json.text = this.text
    if (this.attributes) json.attributes = this.attributes
    if (this.children) {
        json.children = {length: this.children.length}
        for (var i = 0; i < this.children.length; i++) {
            json.children[i] = this.children[i].toJson()
        }
    }

    return json
}

/**
 * Allocate, setup and attach dom element.
 *
 * @api private
 */
Node.prototype.render = function() {
    if (!this.dirty) return this

    if (this.dirty.name) {
        if (this.target) this.migrate()
        else this.target = pool.allocate(this.name)
    }

    if (!this.target) this.target = pool.allocate(this.name)

    // Handle insert.
    if (this.dirty.insert && this.children) {
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i]
            if (child.dirty) {
                child.render()
                var prevChild = this.children[i - 1]
                var nextElement
                if (prevChild) nextElement = prevChild.target.nextSibling
                this.target.insertBefore(child.target, nextElement)
            }
        }
    }

    // Handle textContent.
    if (this.dirty.text && this.text) this.target.textContent = this.text

    // Handle attribtues.
    if (this.dirty.attributes) {
        var attributes = this.dirty.attributes == true ? this.attributes : this.dirty.attributes
        for (var attrName in attributes) {
            var value = attributes[attrName]
            if (value == null) {
                delete this.attributes[attrName]
                this.target.removeAttribute(attrName)
            } else {
                this.attributes[attrName] = value
                this.target.setAttribute(attrName, value)
            }
        }

    }

    this.dirty = null
}

/**
 * Remove a dom node and cleanup.
 *
 * @param {Node} node
 * @return {Node}
 * @api private
 */
Node.prototype.remove = function() {
    this.detach()
    this.cleanup()

    // Remove children.
    if (this.children) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].remove()
        }

        // Avoid calling .unlink on children again later.
        this.children = null
    }

    pool.deallocate(this.target)
    this.unlink()
}

/**
 * Migrate current target and its childs to a new element.
 * F.e. because tagName changed.
 *
 * @api private
 */
Node.prototype.migrate = function() {
    this.detach()
    this.cleanup()
    var oldTarget = this.target
    this.target = pool.allocate(this.name)
    while (oldTarget.hasChildNodes()) {
        this.target.appendChild(oldTarget.removeChild(oldContainer.firstChild))
    }
    pool.deallocate(oldTarget)
}

/**
 * Remove target from the render tree.
 *
 * @api private
 */
Node.prototype.detach = function() {
    this.target.parentNode.removeChild(this.target)
}

/**
 * Clean up everything changed on current target.
 *
 * @api private
 */
Node.prototype.cleanup = function() {
    if (this.attributes) {
        for (var attrName in this.attributes) this.target.removeAttribute(attrName)
    }
    if (this.text) this.target.textContent = ''
}

/**
 * Clean up all references for better garbage collection.
 *
 * @api private
 */
Node.prototype.unlink = function() {
    if (this.children) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].unlink()
        }
    }
    this.name = null
    this.text = null
    this.attributes = null
    this.parent = null
    this.children = null
    this.target = null
}

/**
 * Insert a node at specified position.
 *
 * @param {Number} position
 * @param {Node} node
 * @api private
 */
Node.prototype.insertAt = function(position, node) {
    if (!this.children) this.children = []
    this.children.splice(position, 0, node)
    if (!this.dirty) this.dirty = {}
    this.dirty.insert = true
    renderQueue.enqueue(this)
}

/**
 * Set nodes attribute.
 *
 * @param {String} name
 * @param {String|Boolean|Null} value, use null to remove
 * @api private
 */
Node.prototype.setAttribute = function(name, value) {
    if (!this.dirty) this.dirty = {attributes: {}}
    if (!this.dirty.attributes) this.dirty.attributes = {}
    this.dirty.attributes[name] = value
    renderQueue.enqueue(this)
}

/**
 * Set text content.
 *
 * @param {String} content
 * @api private
 */
Node.prototype.setText = function(text) {
    if (!this.dirty) this.dirty = {}
    this.dirty.text = true
    this.text = text
    renderQueue.enqueue(this)
}

/**
 * Element name can't be set, we need to swap out the element.
 *
 * @param {String} name
 * @api private
 */
Node.prototype.setName = function(name) {
    if (!this.dirty) this.dirty = {}
    this.dirty.name = true
    this.name = name
    renderQueue.enqueue(this)
}

},{"./elements-pool":2,"./render-queue":6}],6:[function(_dereq_,module,exports){
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


},{}],7:[function(_dereq_,module,exports){
'use strict'

var docdiff = _dereq_('docdiff')
var keypath = _dereq_('./keypath')
var Node = _dereq_('./node')
var Modifier = _dereq_('./modifier')
var serializeDom = _dereq_('./serialize-dom')
var serializeHtml = _dereq_('./serialize-html')
var renderQueue = _dereq_('./render-queue')

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
    this.node = new Node(json)
    this.modifier = new Modifier(this.node)

    return this
}

/**
 * Render changes to DOM.
 *
 * @param {String} html
 * @return {Renderer} this
 * @api public
 */
Renderer.prototype.render = function(html) {
    var current = this.node.toJson().children || {}
    var next = serializeHtml(html).children
    var changes = docdiff(current, next)
    this.modifier.apply(changes)
    for (var i = 0; i < renderQueue.length; i++) {
        if (renderQueue[i].dirty) renderQueue[i].render()
    }
    renderQueue.empty()

    return this
}

},{"./keypath":3,"./modifier":4,"./node":5,"./render-queue":6,"./serialize-dom":8,"./serialize-html":9,"docdiff":11}],8:[function(_dereq_,module,exports){
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

},{}],9:[function(_dereq_,module,exports){
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
    str = str.trim()
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

},{}],10:[function(_dereq_,module,exports){

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
},{"./utils":12}],11:[function(_dereq_,module,exports){

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

},{"./arraydiff":10,"./utils":12}],12:[function(_dereq_,module,exports){

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