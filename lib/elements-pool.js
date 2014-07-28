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
