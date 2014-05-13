test('text node 0', function() {
    var node = htmlToJson('a').children[0]
    addIds(node)
    equal(node.name, '#text', 'node name')
    equal(node.text, 'a', 'node text')
    equal(node.id, 123798090, 'node id')
})

test('text node 1', function() {
    var node = htmlToJson(' abc ').children[0]
    addIds(node)
    equal(node.name, '#text', 'node name')
    equal(node.text, ' abc ', 'node text')
    equal(node.id, 315884367, 'node id')
})

test('empty node 0', function() {
    var node = htmlToJson('<a/>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 6422626, 'node id')
})

test('empty node 1', function() {
    var node = htmlToJson('< a/>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 6422626, 'node id')
})

test('empty node 2', function() {
    var node = htmlToJson('< a / >').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 6422626, 'node id')
})

test('empty node 3', function() {
    var node = htmlToJson('<\na\n/\n>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 6422626, 'node id')
})

test('closing tag', function() {
    deepEqual(htmlToJson('</a>'), {})
    deepEqual(htmlToJson('< / a\n >'), {})
    deepEqual(htmlToJson('<\n/\n a\n >'), {})
})

test('attributes 0', function() {
    var node = htmlToJson('<a id/>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: ''}, 'attributes')
    equal(node.id, 39584047, 'node id')
})

test('attributes 1', function() {
    var node = htmlToJson('<a id=""/>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: ''}, 'attributes')
    equal(node.id, 39584047, 'node id')
})

test('attributes 2', function() {
    var node = htmlToJson('<a id=\'\'/>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: ''}, 'attribtues')
    equal(node.id, 39584047, 'node id')
})

test('attributes 3', function() {
    var node = htmlToJson('<a id="a"/>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: 'a'}, 'attributes')
    equal(node.id, 65798544, 'node id')
})

test('attributes 4', function() {
    var node = htmlToJson('<a id = \'a\'/>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: 'a'}, 'attributes')
    equal(node.id, 65798544, 'node id')
})

test('attributes 5', function() {
    var node = htmlToJson('<a id\n=\n"a\'"/>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: "a'"}, 'attributes')
    equal(node.id, 94568887, 'node id')
})

test('attributes 6', function() {
    var node = htmlToJson('<a id\n=\n"a=\'b\'"\n/>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: "a='b'"}, 'attributes')
    equal(node.id, 209715837, 'node id')
})

test('attributes 7', function() {
    var node = htmlToJson('<a id="a" class="\nb "/>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: 'a', class: '\nb '}, 'attributes')
    equal(node.id, 499844146, 'node id')
})

test('attributes 8', function() {
    var node = htmlToJson('<a attr1="first"attr2="second"/>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {attr1: 'first', attr2: 'second'}, 'attributes')
    equal(node.id, 1708460255, 'node id')
})

test('attributes 9', function() {
    var node = htmlToJson('<a attr="<p>"/>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {attr: '<p>'}, 'attributes')
    equal(node.id, 239928071, 'node id')
})

test('children 0', function() {
    var node = htmlToJson('<a>a</a>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 168362667, 'node id')
    equal(node.children[0].name, '#text', 'child name')
    equal(node.children[0].text, 'a', 'child text')
    equal(node.children.length, 1, 'children length')
})

test('children 1', function() {
    var node = htmlToJson('<a>\n</a>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 162660948, 'node id')
    equal(node.children[0].name, '#text', 'child 0 name')
    equal(node.children[0].text, '\n', 'child 0 text')
    equal(node.children[0].id, 118096371, 'child 0 id')
    equal(node.children.length, 1, 'children length')
})

test('children 2', function() {
    var node = htmlToJson('<a> a \n b </a>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 479593367, 'node id')
    equal(node.children[0].name, '#text', 'child 0 name')
    equal(node.children[0].text, ' a \n b ', 'child 0 text')
    equal(node.children[0].id, 396886838, 'child 0 id')
    equal(node.children.length, 1, 'children length')
})

test('children 3', function() {
    var node = htmlToJson('<a>\n<b></b></a>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 208143030, 'node id')
    equal(node.children[0].name, '#text', 'child 0 name')
    equal(node.children[0].text, '\n', 'child 0 text')
    equal(node.children[0].id, 118096371, 'child 0 id')
    equal(node.children[1].name, 'b', 'child 1 name')
    equal(node.children[1].id, 6488163, 'child 1 id')
    equal(node.children.length, 2, 'children length')
})

test('children 4', function() {
    var node = htmlToJson('<a>\n<b/>\n\n<c/></a>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 762774805, 'node id')
    equal(node.children[0].name, '#text', 'child 0 name')
    equal(node.children[0].text, '\n', 'child 0 text')
    equal(node.children[0].id, 118096371, 'child 0 id')
    equal(node.children[1].name, 'b', 'child 1 name')
    equal(node.children[1].id, 6488163, 'child 1 id')
    equal(node.children[2].name, '#text', 'child 2 name')
    equal(node.children[2].text, '\n\n', 'child 2 text')
    equal(node.children[2].id, 151454205, 'child 2 id')
    equal(node.children[3].name, 'c', 'child 3 name')
    equal(node.children[3].id, 6553700, 'child 3 id')
    equal(node.children.length, 4, 'children length')
})

test('children 5', function() {
    var node = htmlToJson('<a><a/></a>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 19202243, 'node id')
    equal(node.children[0].name, 'a', 'child 0 name')
    equal(node.children[0].id, 6422626, 'child 0 id')
    equal(node.children.length, 1, 'children length')
})

test('children 5', function() {
    var node = htmlToJson('<a><b></b></a>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 19267780, 'node id')
    equal(node.children[0].name, 'b', 'child 0 name')
    equal(node.children[0].id, 6488163, 'child 0 id')
    equal(node.children.length, 1, 'children length')
})

test('children 6', function() {
    var node = htmlToJson('<a><b class="c"></b></a>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 240255805, 'node id')
    equal(node.children[0].name, 'b', 'child 0 name')
    equal(node.children[0].id, 189334236, 'child 0 id')
    deepEqual(node.children[0].attributes, {class: 'c'}, 'child 0 attributes')
    equal(node.children.length, 1, 'children length')
})

test('collection 0', function() {
    var nodes = htmlToJson('<a/><b/>').children
    addIds(nodes)
    equal(nodes[0].name, 'a', 'node 0 name')
    equal(nodes[0].id, 6422626, 'node 0 id')
    equal(nodes[1].name, 'b', 'node 1 name')
    equal(nodes[1].id, 6488163, 'node 1 id')
    equal(nodes.length, 2, 'nodes length')
})

test('collection 1', function() {
    var node = htmlToJson('<a><b/><c/></a>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 38600999, 'node id')
    equal(node.children[0].name, 'b', 'child 0 name')
    equal(node.children[0].id, 6488163, 'child 0 id')
    equal(node.children[1].name, 'c', 'child 1 name')
    equal(node.children[1].id, 6553700, 'child 1 id')
    equal(node.children.length, 2, 'children length')
})

test('collection 2', function() {
    var node = htmlToJson('<a><b></b><c/></a>').children[0]
    addIds(node)
    equal(node.name, 'a', 'node name')
    equal(node.id, 38600999, 'node id')
    equal(node.children[0].name, 'b', 'child 0 name')
    equal(node.children[0].id, 6488163, 'child 0 id')
    equal(node.children[1].name, 'c', 'child 1 name')
    equal(node.children[1].id, 6553700, 'child 1 id')
    equal(node.children.length, 2, 'children length')
})
