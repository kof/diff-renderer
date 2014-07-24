var html = require('fs').readFileSync(__dirname + '/test.html', 'utf8'),
    serializeHtml = require('../lib/serialize-html'),
    htmlParser = require('html-minifier/src/htmlparser'),
    htmltree = require('htmltree')

var noop = function() {}

exports.compare = {}

exports.compare.diffRenderer = function() {
    serializeHtml(html)
}

exports.compare.htmlParser = function() {
    htmlParser.HTMLParser(html, {})
}

exports.compare.htmltree = function() {
    htmltree(html, noop)
}

exports.stepsPerLap = 10

require('bench').runMain()
