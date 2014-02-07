var htmlToJson = require('../lib/htmlToJson'),
    a = require('assert')

function toJson(str) {
    var obj = htmlToJson(str)

    ;(function decycle(obj) {
        if (obj) {
            delete obj.parent
            if (obj.children) obj.children.forEach(decycle)
        }
    }(obj))

    return obj
}

// Text node
a.deepEqual(toJson('a').children[0], {name: '#text', text: 'a'})
a.deepEqual(toJson(' abc ').children[0], {name: '#text', text: ' abc '})

// Empty tag
a.deepEqual(toJson('<a/>').children[0], {name: 'a'})
a.deepEqual(toJson('< a/>').children[0], {name: 'a'})
a.deepEqual(toJson('< a / >').children[0], {name: 'a'})
a.deepEqual(toJson('<\na\n/\n>').children[0], {name: 'a'})

// Closing tag
a.deepEqual(toJson('</a>'), {})
a.deepEqual(toJson('< / a\n >'), {})
a.deepEqual(toJson('<\n/\n a\n >'), {})

// Attributes
a.deepEqual(toJson('<a id/>').children[0], {name: 'a', attributes: {id: ''}})
a.deepEqual(toJson('<a id=""/>').children[0], {name: 'a', attributes: {id: ''}})
a.deepEqual(toJson('<a id=\'\'/>').children[0], {name: 'a', attributes: {id: ''}})
a.deepEqual(toJson('<a id="a"/>').children[0], {name: 'a', attributes: {id: 'a'}})
a.deepEqual(toJson('<a id = \'a\'/>').children[0], {name: 'a', attributes: {id: 'a'}})
a.deepEqual(toJson('<a id="a"/>').children[0], {name: 'a', attributes: {id: 'a'}})
a.deepEqual(toJson('<a id\n=\n"a\'"/>').children[0], {name: 'a', attributes: {id: "a'"}})
a.deepEqual(toJson('<a id\n=\n"a=\'b\'"\n/>').children[0], {name: 'a', attributes: {id: "a='b'"}})
a.deepEqual(toJson('<a id="a" class="\nb "/>').children[0], {name: 'a', attributes: {id: 'a', class: '\nb '}})
a.deepEqual(toJson('<a attr1="first"attr2="second"/>').children[0], {name: 'a', attributes: {attr1: 'first', attr2: 'second'}})

// Children
a.deepEqual(toJson('<a>a</a>').children[0], {name: 'a', children: [{name: '#text', text: 'a'}]})
a.deepEqual(toJson('<a> a\n</a>').children[0], {name: 'a', children: [{name: '#text', text: ' a\n'}]})
a.deepEqual(toJson('<a><a/></a>').children[0], {name: 'a', children: [{name: 'a'}]})
a.deepEqual(toJson('<a><b></b></a>').children[0], {name: 'a', children: [{name: 'b'}]})
a.deepEqual(toJson('<a><b class="c"></b></a>').children[0], {name: 'a', children: [{name: 'b', attributes: {class: 'c'}}]})

// Collection
a.deepEqual(toJson('<a/><b/>'), {children: [{name: 'a'}, {name: 'b'}]})
a.deepEqual(toJson('<a><b/><c/></a>').children[0], {name: 'a', children: [{name: 'b'}, {name: 'c'}]})
a.deepEqual(toJson('<a><b></b><c/></a>').children[0], {name: 'a', children: [{name: 'b'}, {name: 'c'}]})

console.log('htmlToJson ok')
