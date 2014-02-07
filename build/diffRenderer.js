!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.DiffRenderer=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
module.exports = _dereq_('./lib')

},{"./lib":6}],2:[function(_dereq_,module,exports){
var domToJson = _dereq_('./domToJson'),
    htmlToJson = _dereq_('./htmlToJson'),
    diff = _dereq_('./diff')

function Renderer(el) {
    this.el = el
    this.state = domToJson(el)
}

module.exports = Renderer

Renderer.prototype.render = function(html) {
    var newState = htmlToJson(html)

    console.log('current', this.state)
    console.log('new', newState)
    console.log('diff', diff(newState, this.state))

    return this
}

},{"./diff":3,"./domToJson":4,"./htmlToJson":5}],3:[function(_dereq_,module,exports){
function markdeleteeted(n, o, diffObj) {
    var key

    for (key in o) {
        if (n[key] == null) {
            if (typeof n[key] == 'object') {
                markdeleteeted(n[key], o[key], diffObj)
            } else {
                diffObj || (diffObj = {})
                diffObj[key] = {type: 'delete'}
            }
        }
    }

    return diffObj
}

module.exports = function diff(n, o) {
    var diffObj,
        subDiffObj,
        key

    for (key in n) {
        if (o[key] !== n[key]) {
            if (typeof n[key] == 'object' && typeof o[key] == 'object') {
                subDiffObj = diff(n[key], o[key])
                if (subDiffObj) {
                    diffObj || (diffObj = {})
                    diffObj[key] = subDiffObj
                }
            } else {
                diffObj || (diffObj = {})
                diffObj[key] = {value: n[key]}
                diffObj[key].type = o[key] == null ? 'create' : 'update'
            }
        }
    }

    return markdeleteeted(n, o, diffObj)
}

},{}],4:[function(_dereq_,module,exports){
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

},{}],5:[function(_dereq_,module,exports){

module.exports = function toJson(str, parent) {
    var i = 0,
        closed = false,
        added = false,
        current,
        isWhite, isSlash, isOpen, isClose,
        inTag = false,
        inTagName = false,
        inAttrName = false,
        inAttrValue = false,
        inCloser = false,
        inClosing = false,
        isQuote, openQuote,
        attrName, attrValue,
        inText = false, text,
        tag = {parent: parent}

    parent || (parent = {})

    if (str) {
        tag.name = ''
    } else {
        return parent
    }

    while (!closed) {
        current = str[i]
        isWhite = current == ' ' || current == '\t' || current == '\r' || current == '\n'
        isSlash = current == '/'
        isOpen = current == '<'
        isClose = current == '>'
        isQuote = current == "'" || current == '"'
        if (isSlash) inClosing = true
        if (isClose) inCloser = false

        if (current == null) {
            closed = true
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
                            if (parent.parent )parent = parent.parent
                        }
                    } else if (isClose) {
                        toJson(str.substr(i + 1), inClosing || inCloser ? parent : tag)
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
                        toJson(str.substr(i + 1), inClosing || inCloser ? parent : tag)
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
                inTag = true
            } else if (isSlash && !inAttrValue) {
                closed = true
            } else {
                inText = true
                tag.name || (tag.name = '#text')
                if (tag.text == null) tag.text = ''
                tag.text += current
            }

            if (tag.name && !added) {
                parent.children || (parent.children = [])
                parent.children.push(tag)
                added = true
            }
        }

        if (isClose) inClosing = false

        ++i
    }

    return parent
}

},{}],6:[function(_dereq_,module,exports){
module.exports = exports = _dereq_('./Renderer')
exports.domToJson = _dereq_('./domToJson')
exports.htmlToJson = _dereq_('./htmlToJson')
exports.diff = _dereq_('./diff')

},{"./Renderer":2,"./diff":3,"./domToJson":4,"./htmlToJson":5}]},{},[1])
(1)
});