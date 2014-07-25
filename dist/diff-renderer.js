!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.DiffRenderer=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
module.exports = _dereq_('./lib/renderer')

},{"./lib/renderer":3}],2:[function(_dereq_,module,exports){
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

},{}],3:[function(_dereq_,module,exports){
'use strict'

var docdiff = _dereq_('docdiff')
var keypath = _dereq_('./keypath')
var serializeDom = _dereq_('./serialize-dom')
var serializeHtml = _dereq_('./serialize-html')

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

},{"./keypath":2,"./serialize-dom":4,"./serialize-html":5,"docdiff":7}],4:[function(_dereq_,module,exports){
'use strict'

/**
 * Walk through the dom and create the same tree like html serializer.
 *
 * @param {Element} el
 * @return {Object}
 * @api private
 */
module.exports = function serialize(el) {
    var node = {name: el.nodeName.toLowerCase(), node: el}
    var attr = el.attributes
    var attrLength
    var childNodes = el.childNodes
    var childNodesLength
    var i

    if (node.name == '#text') {
        node.text = el.textContent
        return node
    }

    if (attr && attr.length) {
        node.attributes = {}
        attrLength = attr.length
        for (i = 0; i < attrLength; i++) {
            node.attributes[attr[i].name] = attr[i].value
        }
    }

    if (childNodes && childNodes.length) {
        node.children = {length: childNodes.length}
        childNodesLength = childNodes.length
        for (i = 0; i < childNodesLength; i++) {
            node.children[i] = serialize(childNodes[i])
        }
    }

    return node
}

},{}],5:[function(_dereq_,module,exports){
'use strict'

/**
 * Parse html and create a json tree.
 *
 * @param {String} html
 * @param {Object} [parent]
 * @return {Object}
 * @api private
 */
module.exports = function serialize(str, parent) {
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
    if (!parent) parent = {name: 'root'}
    var tag = {parent: parent}


    if (str) {
        tag.name = ''
    } else {
        return parent
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
                    delete tag.name
                // Tag name
                } else if (inTagName || !tag.name) {
                    inTagName = true
                    if ((tag.name && isWhite) || isSlash) {
                        inTagName = false
                        if (!tag.name) {
                            inCloser = true
                            if (parent.parent) parent = parent.parent
                        }
                    } else if (isClose) {
                        serialize(str.substr(i + 1), inClosing || inCloser ? parent : tag)
                        return parent
                    } else if (!isWhite) {
                        tag.name += current
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
                            if (!tag.attributes) tag.attributes = {}
                            tag.attributes[attrName] = ''
                        }
                    } else if (isClose) {
                        serialize(str.substr(i + 1), inClosing || inCloser ? parent : tag)
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
                                if (attrValue) tag.attributes[attrName] = attrValue
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
                if (!tag.name) tag.name = '#text'
                if (tag.text == null) tag.text = ''
                tag.text += current
            }

            if (tag.name && !added) {
                if (!parent.children) parent.children = {length: 0}
                parent.children[parent.children.length] = tag
                parent.children.length++
                added = true
            }
        }

        if (isClose) inClosing = false

        ++i
    }

    return parent
}

},{}],6:[function(_dereq_,module,exports){

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
},{"./utils":8}],7:[function(_dereq_,module,exports){

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

},{"./arraydiff":6,"./utils":8}],8:[function(_dereq_,module,exports){

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