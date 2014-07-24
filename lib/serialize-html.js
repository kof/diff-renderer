/**
 * Parse html and create a json tree.
 *
 * @param {String} html
 * @param {Object} [parent]
 * @return {Object}
 * @api private
 */
module.exports = function serialize(str, parent) {
    var i = 0
    var end = false
    var added = false
    var current
    var isWhite, isSlash, isOpen, isClose
    var inTag = false
    var inTagName = false
    var inAttrName = false
    var inAttrValue = false
    var inCloser = false
    var inClosing = false
    var isQuote, openQuote,
    var attrName, attrValue
    var inText = false
    var tag = {parent: parent}

    parent || (parent = {})

    if (str) {
        tag.name = ''
    } else {
        return parent
    }

    while (!end) {
        current = str[i]
        isWhite = current == ' ' || current == '\t' || current == '\r' || current == '\n'
        isSlash = current == '/'
        isOpen = current == '<'
        isClose = current == '>'
        isQuote = current == "'" || current == '"'
        if (isSlash) inClosing = true
        if (isClose) inCloser = false

        if (current == null) {
            end = true
        } else {
            if (inTag) {
                if (inCloser) {
                    delete tag.name
                // Tag name
                } else if (inTagName || !tag.name) {
                    inTagName = true
                    if ((tag.name && isWhite) || isSlash) {
                        inTagName = false
                        if (!tag.name) {
                            inCloser = true
                            if (parent.parent) parent = parent.parent
                        }
                    } else if (isClose) {
                        serialize(str.substr(i + 1), inClosing || inCloser ? parent : tag)
                        return parent
                    } else if (!isWhite) {
                        tag.name += current
                    }
                // Attribute name
                } else if (inAttrName || !attrName) {
                    inAttrName = true
                    if (attrName == null) attrName = ''
                    if (isSlash ||
                        (attrName && isWhite) ||
                        (attrName && current == '=')) {

                        inAttrName = false
                        if (attrName) {
                            tag.attributes || (tag.attributes = {})
                            tag.attributes[attrName] = ''
                        }
                    } else if (isClose) {
                        serialize(str.substr(i + 1), inClosing || inCloser ? parent : tag)
                        return parent
                    } else if (!isWhite) {
                        attrName += current
                    }
                // Attribute value
                } else if (inAttrValue || attrName) {
                    if (attrValue == null) attrValue = ''

                    if (isQuote) {
                        if (inAttrValue) {
                            if (current == openQuote) {
                                if (attrValue) tag.attributes[attrName] = attrValue
                                inAttrValue = false
                                attrName = attrValue = null
                            } else {
                                attrValue += current
                            }
                        } else {
                            inAttrValue = true
                            openQuote = current
                        }
                    } else if (inAttrValue) {
                        attrValue += current
                    }
                }
            } else if (isOpen) {
                if (inText) {
                    serialize(str.substr(i), parent)
                    return parent
                }
                inTag = true
            } else if (isSlash && !inAttrValue) {
                end = true
            } else {
                inText = true
                inTag = false
                tag.name || (tag.name = '#text')
                if (tag.text == null) tag.text = ''
                tag.text += current
            }

            if (tag.name && !added) {
                parent.children || (parent.children = {length: 0})
                parent.children[parent.children.length] = tag
                parent.children.length++
                added = true
            }
        }

        if (isClose) inClosing = false

        ++i
    }

    return parent
}
