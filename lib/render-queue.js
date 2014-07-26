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

