'use strict'

var ElementsPool = require('./elements-pool')
var renderQueue = require('./render-queue')

// Global elements pool for all nodes and all renderer instances.
var pool = new ElementsPool()

/**
 * Abstract node which can be rendered to a dom node.
 *
 * @param {Object} options
 * @param {String} options.name
 * @param {String} [options.text]
 * @param {Object} [options.attributes]
 * @param {Element} [options.element] if element is passed, node is already rendered
 * @param {Object} [options.children]
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
    if (options.element) {
        this.dirty = null
    } else {
        this.dirty = {
            insert: true,
            text: true,
            attributes: true,
            name: true
        }
    }

    if (options.children) {
        this.children = []
        for (var i in options.children) {
            if (i != 'length') this.children[i] = new Node(options.children[i], this)
        }
        if (this.dirty) this.dirty.children = true
    }
}

module.exports = Node

/**
 * Serialize instance to json data.
 *
 * @return {Object}
 * @api private
 */
Node.prototype.toJson = function() {
    var json = {name: this.name}
    if (this.text) json.text = this.text
    if (this.attributes) json.attributes = this.attributes
    if (this.children) {
        json.children = {length: this.children.length}
        for (var i = 0; i < this.children.length; i++) {
            json.children[i] = this.children[i].toJson()
        }
    }

    return json
}

/**
 * Allocate, setup and attach dom element.
 *
 * @api private
 */
Node.prototype.render = function() {
    if (!this.dirty) return this

    if (this.dirty.name) {
        if (this.target) this.migrate()
        else this.target = pool.allocate(this.name)
    }

    if (!this.target) this.target = pool.allocate(this.name)

    // Handle insert.
    if (this.dirty.insert && this.children) {
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i]
            if (child.dirty) {
                child.render()
                var prevChild = this.children[i - 1]
                var nextElement
                if (prevChild) nextElement = prevChild.target.nextSibling
                this.target.insertBefore(child.target, nextElement)
            }
        }
    }

    // Handle textContent.
    if (this.dirty.text && this.text) this.target.textContent = this.text

    // Handle attribtues.
    if (this.dirty.attributes) {
        var attributes = this.dirty.attributes == true ? this.attributes : this.dirty.attributes
        for (var attrName in attributes) {
            var value = attributes[attrName]
            if (value == null) {
                delete this.attributes[attrName]
                this.target.removeAttribute(attrName)
            } else {
                this.attributes[attrName] = value
                this.target.setAttribute(attrName, value)
            }
        }

    }

    this.dirty = null
}

/**
 * Remove a dom node and cleanup.
 *
 * @param {Node} node
 * @return {Node}
 * @api private
 */
Node.prototype.remove = function() {
    this.detach()
    this.cleanup()

    // Remove children.
    if (this.children) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].remove()
        }

        // Avoid calling .unlink on children again later.
        this.children = null
    }

    pool.deallocate(this.target)
    this.unlink()
}

/**
 * Migrate current target and its childs to a new element.
 * F.e. because tagName changed.
 *
 * @api private
 */
Node.prototype.migrate = function() {
    this.detach()
    this.cleanup()
    var oldTarget = this.target
    this.target = pool.allocate(this.name)
    while (oldTarget.hasChildNodes()) {
        this.target.appendChild(oldTarget.removeChild(oldContainer.firstChild))
    }
    pool.deallocate(oldTarget)
}

/**
 * Remove target from the render tree.
 *
 * @api private
 */
Node.prototype.detach = function() {
    this.target.parentNode.removeChild(this.target)
}

/**
 * Clean up everything changed on current target.
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
 * Clean up all references for better garbage collection.
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
    if (!this.children) this.children = []
    this.children.splice(position, 0, node)
    if (!this.dirty) this.dirty = {}
    this.dirty.insert = true
    renderQueue.enqueue(this)
}

/**
 * Set nodes attribute.
 *
 * @param {String} name
 * @param {String|Boolean|Null} value, use null to remove
 * @api private
 */
Node.prototype.setAttribute = function(name, value) {
    if (!this.dirty) this.dirty = {attributes: {}}
    if (!this.dirty.attributes) this.dirty.attributes = {}
    this.dirty.attributes[name] = value
    renderQueue.enqueue(this)
}

/**
 * Set text content.
 *
 * @param {String} content
 * @api private
 */
Node.prototype.setText = function(text) {
    if (!this.dirty) this.dirty = {}
    this.dirty.text = true
    this.text = text
    renderQueue.enqueue(this)
}

/**
 * Element name can't be set, we need to swap out the element.
 *
 * @param {String} name
 * @api private
 */
Node.prototype.setName = function(name) {
    if (!this.dirty) this.dirty = {}
    this.dirty.name = true
    this.name = name
    renderQueue.enqueue(this)
}
