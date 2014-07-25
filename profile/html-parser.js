var serializeHtml = require('../lib/serialize-html')
var html = require('fs').readFileSync(__dirname + '/../bench/test.html', 'utf8')

var i = 10000

var now = Date.now()

while (i > 0) {
    serializeHtml(html)
    i--
}

console.log(Date.now() - now)
