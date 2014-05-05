var domToJson = require('./domToJson'),
    htmlToJson = require('./htmlToJson'),
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
    this.state = null
    this.serialize()
}

module.exports = Renderer

/**
 * Read DOM state.
 *
 * @return {Object} state
 * @api public
 */
Renderer.prototype.serialize = function() {
    return this.state = domToJson(this.el).children
}

/**
 * Render changes to DOM.
 *
 * @param {String} html
 * @return {Renderer} this
 * @api public
 */
Renderer.prototype.render = function(html) {
    var newState, todo

    // this.el is empty, nothing to diff.
    if (!this.state) {
        this.el.innerHTML = html
        this.serialize()
        return this
    }

    newState = htmlToJson(html).children
    todo = docDiff(this.state, newState)

    console.log('current', this.state)
    console.log('new', newState)
    console.log('todo', todo)

    todo.forEach(function(todo) {
        this._apply(todo, this.el)
    }, this)

    return this
}

Renderer.prototype._apply = function(todo, parent) {
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
}

Renderer.prototype._createElement = function() {

}
