var serializeDom = require('./serialize-dom'),
    serializeHtml = require('./serialize-html'),
    keypath = require('./keypath'),
    docdiff = require('docdiff')

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
    var newTree, changes

    // this.el is empty, nothing to diff.
    if (!this.tree) {
        this.el.innerHTML = html
        this.serialize()
        return this
    }

    newTree = serializeHtml(html).children
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
                        this._createNode(
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
Renderer.prototype._createNode = function(name, text, attrs) {
    var el, attr

    el = name == '#text' ? createTextNode(text) : createElement(name)

    for (attr in attrs) el.setAttribute(attr, attrs[attr])

    return el
}
