var html = require('fs').readFileSync(__dirname + '/test.html', 'utf8'),
    htmlToJson = require('../lib/htmlToJson'),
    htmlParser = require('html-minifier/src/htmlparser')

exports.compare = {}

exports.compare.diffRenderer = function() {
    htmlToJson(html)
}

exports.compare.htmlParser = function() {
    htmlParser.HTMLParser(html, {})
}

exports.stepsPerLap = 10

require('bench').runMain()

