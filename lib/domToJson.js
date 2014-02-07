module.exports = function toJson(el) {
    var node = {name: el.nodeName.toLowerCase(), element: el},
        attr = el.attributes, attrLength,
        childNodes = el.childNodes, childNodesLength,
        childJson,
        i

    if (node.name == '#text') {
        node.text = el.textContent.trim()
        if (!node.text) return
    }

    if (attr && attr.length) {
        node.attributes = {}
        attrLength = attr.length
        for (i = 0; i < attrLength; i++) {
            if (attr[i].name != 'style') {
                node.attributes[attr[i].name] = attr[i].value;
            }
        }
    }


    if (childNodes && childNodes.length) {
      node.children = []
      childNodesLength = childNodes.length
      for (i = 0; i < childNodesLength; i++) {
        childJson = toJson(childNodes[i])
        if (childJson) node.children[i] = childJson
      }
    }

    return node
}
