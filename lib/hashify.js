'use strict'

var adler32 = require('./adler32')

/**
 * Add hashes to every node.
 * Hash is calculated using node name, text, attributes and child nodes.
 *
 * @param {Object} node
 * @return {String} str which is used to generate a hash
 * @api private
 */
module.exports = function hashify(node) {
    var attr, i
    var str = ''
    var nodes

    if (!node) return str

    if (node.name) {
        str += node.name
        if (node.text) str += node.text

        for (attr in node.attributes) {
            str += attr + node.attributes[attr]
        }

        nodes = node.children
    // Its a collection.
    } else {
        nodes = node
    }

    for (i in nodes) {
        str += hashify(nodes[i])
    }

    node.hash = adler32(str)

    return str
}
