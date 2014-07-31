'use strict'

var docdiff = require('docdiff')
var keypath = require('./keypath')
var Node = require('./node')
var Modifier = require('./modifier')
var serializeDom = require('./serialize-dom')
var serializeHtml = require('./serialize-html')
var renderQueue = require('./render-queue')
var hashify = require('./hashify')

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
