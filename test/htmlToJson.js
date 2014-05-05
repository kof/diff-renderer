var htmlToJson = require('../lib/htmlToJson'),
    a = require('assert')

function toJson(str) {
    var obj = htmlToJson(str)

    ;(function decycle(obj) {
        var i
        if (obj) {
            delete obj.parent
            if (obj.children) {
                for (i in obj.children) {
                    decycle(obj.children[i])
                }
            }
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
a.deepEqual(toJson('<a attr="<p>"/>').children[0], {name: 'a', attributes: {attr: '<p>'}}, 'html within attribute')

// Children
a.deepEqual(toJson('<a>a</a>').children[0], {name: 'a', children: {0: {name: '#text', text: 'a'}, length: 1}})
a.deepEqual(toJson('<a>\n</a>').children[0], {name: 'a', children: {0: {name: '#text', text: '\n'}, length: 1}})
a.deepEqual(toJson('<a> a \n b </a>').children[0], {name: 'a', children: {0: {name: '#text', text: ' a \n b '}, length: 1}})
a.deepEqual(toJson('<a>\n<b></b></a>').children[0], {name: 'a', children: {0: {name: '#text', text: '\n'}, 1: {name: 'b'}, length: 2}})
a.deepEqual(toJson('<a>\n<b/>\n\n<c/></a>').children[0], {name: 'a', children: {0: {name: '#text', text: '\n'}, 1: {name: 'b'}, 2: {name: '#text', text: '\n\n'}, 3: {name: 'c'}, length: 4}})
a.deepEqual(toJson('<a><a/></a>').children[0], {name: 'a', children: {0: {name: 'a'}, length: 1}})
a.deepEqual(toJson('<a><b></b></a>').children[0], {name: 'a', children: {0: {name: 'b'}, length: 1}})
a.deepEqual(toJson('<a><b class="c"></b></a>').children[0], {name: 'a', children: {0: {name: 'b', attributes: {class: 'c'}}, length: 1}})

// Collection
a.deepEqual(toJson('<a/><b/>'), {children: {0: {name: 'a'}, 1: {name: 'b'}, length: 2}})
a.deepEqual(toJson('<a><b/><c/></a>').children[0], {name: 'a', children: {0: {name: 'b'}, 1: {name: 'c'}, length: 2}})
a.deepEqual(toJson('<a><b></b><c/></a>').children[0], {name: 'a', children: {0: {name: 'b'}, 1: {name: 'c'}, length: 2}})

console.log('htmlToJson ok')
