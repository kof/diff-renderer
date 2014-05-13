var adler32 = require('./adler32')

module.exports = function addIds(node) {
    var key, nr,
        str = '',
        nodes

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

    for (nr in nodes) {
        str += addIds(nodes[nr])
    }

    node.id = adler32(str)
    node.idStr = str

    return str
}
