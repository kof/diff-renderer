module.exports = function toJson(el) {
    var node = {name: el.nodeName.toLowerCase()},
        attr = el.attributes, attrLength,
        childNodes = el.childNodes, childNodesLength,
        i

    if (node.name == '#text') {
        node.text = el.textContent
        return node
    }

    if (attr && attr.length) {
        node.attributes = {}
        attrLength = attr.length
        for (i = 0; i < attrLength; i++) {
            node.attributes[attr[i].name] = attr[i].value
        }
    }

    if (childNodes && childNodes.length) {
        node.children = {length: childNodes.length}
        childNodesLength = childNodes.length
        for (i = 0; i < childNodesLength; i++) {
            node.children[i] = toJson(childNodes[i])
        }
    }

    return node
}
