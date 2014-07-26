'use strict'

var docdiff = require('docdiff')
var keypath = require('./keypath')
var Node = require('./node')
var Modifier = require('./modifier')
var serializeDom = require('./serialize-dom')
var serializeHtml = require('./serialize-html')
var renderQueue = require('./render-queue')

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
