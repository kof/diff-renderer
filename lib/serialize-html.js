'use strict'

/**
 * Simplified html parser. The fastest one written in javascript.
 * It is naive and requires valid html.
 * You might want to validate your html before to pass it here.
 *
 * @param {String} html
 * @param {Object} [parent]
 * @return {Object}
 * @api private
 */
module.exports = function serialize(str, parent) {
    if (!parent) parent = {name: 'root'}
    if (!str) return parent

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
    var isQuote, openQuote
    var attrName, attrValue
    var inText = false

    var json = {
        parent: parent,
        name: ''
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
                    delete json.name
                // Tag name
                } else if (inTagName || !json.name) {
                    inTagName = true
                    if ((json.name && isWhite) || isSlash) {
                        inTagName = false
                        if (!json.name) {
                            inCloser = true
                            if (parent.parent) parent = parent.parent
                        }
                    } else if (isClose) {
                        serialize(str.substr(i + 1), inClosing || inCloser ? parent : json)
                        return parent
                    } else if (!isWhite) {
                        json.name += current
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
                            if (!json.attributes) json.attributes = {}
                            json.attributes[attrName] = ''
                        }
                    } else if (isClose) {
                        serialize(str.substr(i + 1), inClosing || inCloser ? parent : json)
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
                                if (attrValue) json.attributes[attrName] = attrValue
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
                if (!json.name) json.name = '#text'
                if (json.text == null) json.text = ''
                json.text += current
            }

            if (json.name && !added) {
                if (!parent.children) parent.children = {length: 0}
                parent.children[parent.children.length] = json
                parent.children.length++
                added = true
            }
        }

        if (isClose) inClosing = false

        ++i
    }

    return parent
}
