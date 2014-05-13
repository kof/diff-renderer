!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.DiffRenderer=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
module.exports = _dereq_('./lib/renderer')

},{"./lib/renderer":5}],2:[function(_dereq_,module,exports){
module.exports = function toJson(el) {
    var node = {name: el.nodeName.toLowerCase(), dom: el},
        attr = el.attributes, attrLength,
        childNodes = el.childNodes, childNodesLength,
        i

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
            node.children[i] = toJson(childNodes[i])
        }
    }

    return node
}

},{}],3:[function(_dereq_,module,exports){

module.exports = function toJson(str, parent) {
    var i = 0,
        end = false,
        added = false,
        current,
        isWhite, isSlash, isOpen, isClose,
        inTag = false,
        inTagName = false,
        inAttrName = false,
        inAttrValue = false,
        inCloser = false,
        inClosing = false,
        isQuote, openQuote,
        attrName, attrValue,
        inText = false,
        tag = {parent: parent}

    parent || (parent = {})

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
                        toJson(str.substr(i + 1), inClosing || inCloser ? parent : tag)
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
                            tag.attributes || (tag.attributes = {})
                            tag.attributes[attrName] = ''
                        }
                    } else if (isClose) {
                        toJson(str.substr(i + 1), inClosing || inCloser ? parent : tag)
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
                    toJson(str.substr(i), parent)
                    return parent
                }
                inTag = true
            } else if (isSlash && !inAttrValue) {
                end = true
            } else {
                inText = true
                inTag = false
                tag.name || (tag.name = '#text')
                if (tag.text == null) tag.text = ''
                tag.text += current
            }

            if (tag.name && !added) {
                parent.children || (parent.children = {length: 0})
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

},{}],4:[function(_dereq_,module,exports){

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
        if (obj[parts[i]]) {
            obj = obj[parts[i]]
        } else if (parts[i + 1]) {
            return
        }
    }

    return obj
}

},{}],5:[function(_dereq_,module,exports){
var domToJson = _dereq_('./domToJson'),
    htmlToJson = _dereq_('./htmlToJson'),
    keypath = _dereq_('./keypath'),
    docdiff = _dereq_('docdiff')

var createTextNode = document.createTextNode.bind(document),
    createElement = document.createElement.bind(document)

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

Renderer.domToJson = domToJson
Renderer.htmlToJson = htmlToJson
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
    dom: true,
    outerHtml: true
}

/**
 * Read DOM state.
 *
 * @return {Object} state
 * @api public
 */
Renderer.prototype.serialize = function() {
    return this.tree = domToJson(this.el).children
}

/**
 * Render changes to DOM.
 *
 * @param {String} html
 * @return {Renderer} this
 * @api public
 */
Renderer.prototype.render = function(html) {
    var newTree, changes

    // this.el is empty, nothing to diff.
    if (!this.tree) {
        this.el.innerHTML = html
        this.serialize()
        return this
    }

    newTree = htmlToJson(html).children
    changes = docdiff(this.tree, newTree)

    console.log('current', this.tree)
    console.log('new', newTree)

    changes.forEach(this._apply, this)

    this.tree = newTree

    return this
}

Renderer.prototype._apply = function(change) {
    var prop = change.path[change.path.length - 1],
        itemPath, item,
        key,
        now = change.values.now

    if (Renderer.IGNORE_PROPERTIES[prop]) return

    // Change text node
    if (prop == 'text') {
        itemPath = change.path.slice(0, change.path.length - 1)
        item = keypath(this.tree, itemPath)
        item.dom.textContent = change.values.now
    // Create node
    } else if (prop == 'children') {
        if (change.change == 'add') {
            itemPath = change.path.slice(0, change.path.length - 1)
            item = keypath(this.tree, itemPath)
            for (key in now) {
                if (key != 'length') {
                    item.dom.appendChild(
                        this._createElement(
                            now[key].name,
                            now[key].text,
                            now[key].attributes
                        )
                    )
                }
            }
        }
    // Change attributes
    } else {
        if (change.change == 'update' || change.change == 'add') {
            itemPath = change.path.slice(0, change.path.length - 2)
            item = keypath(this.tree, itemPath)
            item.dom.setAttribute(prop, change.values.now)
        } else if (change.change == 'remove') {
            itemPath = change.path.slice(0, change.path.length - 1)
            item = keypath(this.tree, itemPath)
            for (prop in change.values.original) {
                item.dom.removeAttribute(prop)
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
 */
Renderer.prototype._createElement = function(name, text, attrs) {
    var el, attr

    el = name == '#text' ? createTextNode(text) : createElement(name)

    for (attr in attrs) el.setAttribute(attr, attrs[attr])

    return el
}

},{"./domToJson":2,"./htmlToJson":3,"./keypath":4,"docdiff":7}],6:[function(_dereq_,module,exports){

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