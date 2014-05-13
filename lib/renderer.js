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

    this._newTree =  newTree
    changes.forEach(this._apply, this)
    this.tree = newTree

    return this
}

Renderer.prototype._apply = function(change) {
    var prop = change.path[change.path.length - 1],
        propIsNum = !isNaN(prop),
        pos,
        itemPath, item, newNode,
        key,
        now = change.values.now

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
                if (!item) item = keypath(this._newTree, itemPath)

                newNode = this._createNode(now.name, now.text, now.attributes)
                this._insertAfter(item.node, newNode)

                // Link the node in the new tree.
                keypath(this._newTree, change.path).node = newNode
            // Append children.
            } else {
                itemPath = change.path.slice(0, change.path.length - 1)
                item = keypath(this.tree, itemPath)
                for (key in now) {
                    if (key != 'length') {
                        item.node.appendChild(
                            this._createNode(
                                now[key].name,
                                now[key].text,
                                now[key].attributes
                            )
                        )
                    }
                }
            }
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
 */
Renderer.prototype._createNode = function(name, text, attrs) {
    var el, attr

    el = name == '#text' ? createTextNode(text) : createElement(name)

    for (attr in attrs) el.setAttribute(attr, attrs[attr])

    return el
}

Renderer.prototype._insertAfter = function(prev, next) {
    prev.parentNode.insertBefore(next, prev.nextSibling)
}
