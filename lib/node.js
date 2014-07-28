'use strict'

var ElementsPool = require('./elements-pool')
var queue = require('./render-queue')

// Global elements pool for all nodes and all renderer instances.
var pool = new ElementsPool()

/**
 * Abstract node which can be rendered to a dom node.
 *
 * @param {Object} options
 * @param {String} options.name tag name
 * @param {String} [options.text] text for the text node
 * @param {Object} [options.attributes] key value hash of name/values
 * @param {Element} [options.element] if element is passed, node is already rendered
 * @param {Object} [options.children] NodeList like collection
 * @param {Node} [parent]
 * @api private
 */
function Node(options, parent) {
    this.name = options.name
    if (options.text) this.text = options.text
    if (options.attributes) this.attributes = options.attributes
    if (options.element) this.target = options.element
    this.parent = parent

    // Not dirty if element passed.
    if (!options.element) {
        this.dirty('name', true)
        if (this.text) this.dirty('text', true)
        if (this.attributes) this.dirty('attributes', this.attributes)
    }

    if (options.children) {
        this.children = []
        for (var i in options.children) {
            if (i != 'length') {
                this.children[i] = new Node(options.children[i], this)
                if (this.children[i].dirty()) this.dirty('children', true)
            }
        }
    }
}

module.exports = Node

/**
 * Serialize instance to json data.
 *
 * @return {Object}
 * @api private
 */
Node.prototype.toJSON = function() {
    var json = {name: this.name}
    if (this.text) json.text = this.text
    if (this.attributes) json.attributes = this.attributes
    if (this.children) {
        json.children = {length: this.children.length}
        for (var i = 0; i < this.children.length; i++) {
            json.children[i] = this.children[i].toJSON()
        }
    }

    return json
}

/**
 * Allocate, setup current target, insert children to the dom.
 *
 * @api private
 */
Node.prototype.render = function() {
    if (!this._dirty) return
    if (this.dirty('name')) {
        if (this.target) this.migrate()
        else this.target = pool.allocate(this.name)
        this.dirty('name', null)
    }

    // Handle children
    if (this.dirty('children') && this.children) {
        var newChildren = []
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i]
            // Children can be dirty for removal or for insertions only.
            // All other changes are handled by the child.render.
            if (child.dirty()) {
                if (child.dirty('remove')) {
                    this.removeChildAt(i)
                    child.dirty('remove', null)
                // Handle insert.
                } else {
                    var next = this.children[i + 1]
                    child.render()
                    this.target.insertBefore(child.target, next && next.target)
                    newChildren.push(child)
                    child.dirty('insert', null)
                    child.dirty('name', null)
                }
            } else {
                newChildren.push(child)
            }
        }
        // We migrate children to the new array because some of them might be removed
        // and if we splice them directly, we will remove wrong elements.
        if (newChildren) this.children = newChildren
        this.dirty('children', null)
    }

    // Handle textContent.
    if (this.dirty('text') && this.text) {
        this.target.textContent = this.text
        this.dirty('text', null)
    }

    // Handle attribtues.
    if (this.dirty('attributes')) {
        var attributes = this.dirty('attributes')
        for (var attrName in attributes) {
            var value = attributes[attrName]
            if (value == null) {
                delete this.attributes[attrName]
                if (this.name != '#text') this.target.removeAttribute(attrName)
            } else {
                if (!this.attributes) this.attributes = {}
                this.attributes[attrName] = value
                this.target.setAttribute(attrName, value)
            }
        }
        this.dirty('attributes', null)
    }
}

/**
 * Remove child DOM element at passed position without removing from children array.
 *
 * @param {Number} position
 * @api private
 */
Node.prototype.removeChildAt = function(position) {
    var child = this.children[position]
    child.detach()
    child.cleanup()
    if (child.children) {
        for (var i = 0; i < child.children.length; i++) {
            child.removeChildAt(i)
        }
    }
    pool.deallocate(child.target)
    child.unlink()
}

/**
 * Migrate target DOM element and its children to a new DOM element.
 * F.e. because tagName changed.
 *
 * @api private
 */
Node.prototype.migrate = function() {
    this.detach()
    this.cleanup()
    var oldTarget = this.target
    this.target = pool.allocate(this.name)

    // Migrate children.
    if (this.name == '#text') {
        this.children = null
    } else {
        this.text = null
        while (oldTarget.hasChildNodes()) {
            this.target.appendChild(oldTarget.removeChild(oldTarget.firstChild))
        }
    }
    pool.deallocate(oldTarget)
    this.dirty('insert', true)
}

/**
 * Remove target DOM element from the render tree.
 *
 * @api private
 */
Node.prototype.detach = function() {
    var parentNode = this.target.parentNode
    if (parentNode) parentNode.removeChild(this.target)
}

/**
 * Clean up everything changed on the target DOM element.
 *
 * @api private
 */
Node.prototype.cleanup = function() {
    if (this.attributes) {
        for (var attrName in this.attributes) this.target.removeAttribute(attrName)
    }
    if (this.text) this.target.textContent = ''
}

/**
 * Set all child nodes set dirty for removal.
 *
 * @api private
 */
Node.prototype.removeChildren = function() {
    if (!this.children) return

    for (var i = 0; i < this.children.length; i++) {
        this.children[i].dirty('remove', true)
    }

    this.dirty('children', true)
}

/**
 * Set child element as dirty for removal.
 *
 * @param {Node} node
 * @api private
 */
Node.prototype.removeChild = function(child) {
    child.dirty('remove', true)
    this.dirty('children', true)
}

/**
 * Clean up all references for current and child nodes.
 *
 * @api private
 */
Node.prototype.unlink = function() {
    if (this.children) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].unlink()
        }
    }
    this.name = null
    this.text = null
    this.attributes = null
    this.parent = null
    this.children = null
    this.target = null
}

/**
 * Insert a node at specified position.
 *
 * @param {Number} position
 * @param {Node} node
 * @api private
 */
Node.prototype.insertAt = function(position, node) {
    this.dirty('children', true)
    node.dirty('insert', true)
    if (!this.children) this.children = []
    this.children.splice(position, 0, node)
}

/**
 * Insert a node at the end.
 *
 * @param {Node} node
 * @api private
 */
Node.prototype.append = function(node) {
    var position = this.children ? this.children.length : 0
    this.insertAt(position, node)
}

/**
 * Set nodes attributes.
 *
 * @param {Object} attribtues
 * @api private
 */
Node.prototype.setAttributes = function(attributes) {
    for (var name in attributes) {
        this.setAttribute(name, attributes[name])
    }
}

/**
 * Set nodes attribute.
 *
 * @param {String} name
 * @param {String|Boolean|Null} value, use null to remove
 * @api private
 */
Node.prototype.setAttribute = function(name, value) {
    if (this.attributes && this.attributes[name] == value) return
    var attributes = this.dirty('attributes') || {}
    attributes[name] = value
    this.dirty('attributes', attributes)
}

/**
 * Remove nodes attribute.
 * @param {String} name
 * @api private
 */
Node.prototype.removeAttribute = function(name) {
    if (this.attributes && this.attributes[name] != null) this.setAttribute(name, null)
}

/**
 * Set text content.
 *
 * @param {String} content
 * @api private
 */
Node.prototype.setText = function(text) {
    if (this.name != '#text' || text == this.text) return
    this.dirty('text', true)
    this.text = text
}

/**
 * Element name can't be set, we need to swap out the element.
 *
 * @param {String} name
 * @api private
 */
Node.prototype.setName = function(name) {
    if (name == this.name) return
    this.dirty('name', true)
    this.parent.dirty('children', true)
    this.name = name
}

/**
 * Get/set/unset a dirty flag, add to render queue.
 *
 * @param {String} name
 * @param {Mixed} [value]
 * @api private
 */
Node.prototype.dirty = function(name, value) {
    // Get flag.
    if (value === undefined) {
        return this._dirty && name ? this._dirty[name] : this._dirty
    }

    // Unset dirty flag.
    if (value === null) {
        if (this._dirty) {
            delete this._dirty[name]
            // If if its not empty object - exist.
            for (name in this._dirty) return
            // For quick check.
            this._dirty = null
        }
    // Set dirty flag.
    } else {
        if (!this._dirty) {
            this._dirty = {}
            // Only enqueue if its the first flag.
            queue.enqueue(this)
        }
        this._dirty[name] = value
    }
}
