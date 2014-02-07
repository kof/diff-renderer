var domToJson = require('./domToJson'),
    htmlToJson = require('./htmlToJson'),
    diff = require('./diff')

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
