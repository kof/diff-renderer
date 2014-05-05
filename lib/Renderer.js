var domToJson = require('./domToJson'),
    htmlToJson = require('./htmlToJson'),
    keypath = require('./keypath'),
    docDiff = require('docdiff')

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

/**
 * Properties we don't need to apply to the dom from the diff.
 *
 * @type {Object}
 * @api public
 */
Renderer.IGNORE_PROPERTIES = {
    parent: true,
    dom: true
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
    changes = docDiff(this.tree, newTree)

    console.log('current', this.tree)
    console.log('new', newTree)

    changes.forEach(this._apply, this)

    this.tree = newTree

    return this
}

Renderer.prototype._apply = function(change) {
    var prop = change.path[change.path.length - 1],
        itemPath, item

    if (Renderer.IGNORE_PROPERTIES[prop]) return

    // Change attributes.
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
        console.log(change, item)

/*
    if (todo.change == 'add') {
        if (todo.path[1] == 'children')
            var el, attr

            if (data.name == '#text') {
                el = createTextNode(data.text)
            } else {
                el = createElement(data.name)
                for (attr in data.attributes) {
                    el.setAttribute(attr, data.attributes[attr])
                }
            }
            parent.appendChild(el)
        }
    }
*/
}

Renderer.prototype._createElement = function() {

}
