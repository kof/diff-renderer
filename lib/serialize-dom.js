'use strict'

/**
 * Walk through the dom and create a json snapshot.
 *
 * @param {Element} element
 * @return {Object}
 * @api private
 */
module.exports = function serialize(element) {
    var json = {
        name: element.nodeName.toLowerCase(),
        element: element
    }

    if (json.name == '#text') {
        json.text = element.textContent
        return json
    }

    var attr = element.attributes
    if (attr && attr.length) {
        json.attributes = {}
        var attrLength = attr.length
        for (var i = 0; i < attrLength; i++) {
            json.attributes[attr[i].name] = attr[i].value
        }
    }

    var childNodes = element.childNodes
    if (childNodes && childNodes.length) {
        json.children = {length: childNodes.length}
        var childNodesLength = childNodes.length
        for (var i = 0; i < childNodesLength; i++) {
            json.children[i] = serialize(childNodes[i])
        }
    }

    return json
}
