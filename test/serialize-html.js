var serializeHtml = DiffRenderer.serializeHtml
var hashify = DiffRenderer.hashify

QUnit.module('serialize-html')

test('text node 0', function() {
    var doc = serializeHtml('a')
    var node = doc.children[0]
    hashify(node)
    equal(doc.name, 'root', 'root name')
    equal(node.name, '#text', 'node name')
    equal(node.text, 'a', 'node text')
    equal(node.hash, 123798090, 'node hash')
})

test('text node 1', function() {
    var node = serializeHtml(' abc ').children[0]
    hashify(node)
    equal(node.name, '#text', 'node name')
    equal(node.text, ' abc ', 'node text')
    equal(node.hash, 315884367, 'node hash')
})

test('empty node 0', function() {
    var node = serializeHtml('<a/>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 6422626, 'node hash')
})

test('empty node 1', function() {
    var node = serializeHtml('< a/>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 6422626, 'node hash')
})

test('empty node 2', function() {
    var node = serializeHtml('< a / >').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 6422626, 'node hash')
})

test('empty node 3', function() {
    var node = serializeHtml('<\na\n/\n>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 6422626, 'node hash')
})

test('closing tag', function() {
    deepEqual(serializeHtml('</a>'), {name: 'root'})
    deepEqual(serializeHtml('< / a\n >'), {name: 'root'})
    deepEqual(serializeHtml('<\n/\n a\n >'), {name: 'root'})
})

test('attributes 0', function() {
    var node = serializeHtml('<a id/>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: ''}, 'attributes')
    equal(node.hash, 39584047, 'node hash')
})

test('attributes 1', function() {
    var node = serializeHtml('<a id=""/>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: ''}, 'attributes')
    equal(node.hash, 39584047, 'node hash')
})

test('attributes 2', function() {
    var node = serializeHtml('<a id=\'\'/>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: ''}, 'attribtues')
    equal(node.hash, 39584047, 'node hash')
})

test('attributes 3', function() {
    var node = serializeHtml('<a id="a"/>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: 'a'}, 'attributes')
    equal(node.hash, 65798544, 'node hash')
})

test('attributes 4', function() {
    var node = serializeHtml('<a id = \'a\'/>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: 'a'}, 'attributes')
    equal(node.hash, 65798544, 'node hash')
})

test('attributes 5', function() {
    var node = serializeHtml('<a id\n=\n"a\'"/>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: "a'"}, 'attributes')
    equal(node.hash, 94568887, 'node hash')
})

test('attributes 6', function() {
    var node = serializeHtml('<a id\n=\n"a=\'b\'"\n/>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: "a='b'"}, 'attributes')
    equal(node.hash, 209715837, 'node hash')
})

test('attributes 7', function() {
    var node = serializeHtml('<a id="a" class="\nb "/>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {id: 'a', class: '\nb '}, 'attributes')
    equal(node.hash, 499844146, 'node hash')
})

test('attributes 8', function() {
    var node = serializeHtml('<a attr1="first"attr2="second"/>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {attr1: 'first', attr2: 'second'}, 'attributes')
    equal(node.hash, 1708460255, 'node hash')
})

test('attributes 9', function() {
    var node = serializeHtml('<a attr="<p>"/>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    deepEqual(node.attributes, {attr: '<p>'}, 'attributes')
    equal(node.hash, 239928071, 'node hash')
})

test('children 0', function() {
    var node = serializeHtml('<a>a</a>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 168362667, 'node hash')
    equal(node.children[0].name, '#text', 'child name')
    equal(node.children[0].text, 'a', 'child text')
    equal(node.children.length, 1, 'children length')
})

test('children 1', function() {
    var node = serializeHtml('<a>\n</a>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 162660948, 'node hash')
    equal(node.children[0].name, '#text', 'child 0 name')
    equal(node.children[0].text, '\n', 'child 0 text')
    equal(node.children[0].hash, 118096371, 'child 0 hash')
    equal(node.children.length, 1, 'children length')
})

test('children 2', function() {
    var node = serializeHtml('<a> a \n b </a>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 479593367, 'node hash')
    equal(node.children[0].name, '#text', 'child 0 name')
    equal(node.children[0].text, ' a \n b ', 'child 0 text')
    equal(node.children[0].hash, 396886838, 'child 0 hash')
    equal(node.children.length, 1, 'children length')
})

test('children 3', function() {
    var node = serializeHtml('<a>\n<b></b></a>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 208143030, 'node hash')
    equal(node.children[0].name, '#text', 'child 0 name')
    equal(node.children[0].text, '\n', 'child 0 text')
    equal(node.children[0].hash, 118096371, 'child 0 hash')
    equal(node.children[1].name, 'b', 'child 1 name')
    equal(node.children[1].hash, 6488163, 'child 1 hash')
    equal(node.children.length, 2, 'children length')
})

test('children 4', function() {
    var node = serializeHtml('<a>\n<b/>\n\n<c/></a>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 762774805, 'node hash')
    equal(node.children[0].name, '#text', 'child 0 name')
    equal(node.children[0].text, '\n', 'child 0 text')
    equal(node.children[0].hash, 118096371, 'child 0 hash')
    equal(node.children[1].name, 'b', 'child 1 name')
    equal(node.children[1].hash, 6488163, 'child 1 hash')
    equal(node.children[2].name, '#text', 'child 2 name')
    equal(node.children[2].text, '\n\n', 'child 2 text')
    equal(node.children[2].hash, 151454205, 'child 2 hash')
    equal(node.children[3].name, 'c', 'child 3 name')
    equal(node.children[3].hash, 6553700, 'child 3 hash')
    equal(node.children.length, 4, 'children length')
})

test('children 5', function() {
    var node = serializeHtml('<a><a/></a>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 19202243, 'node hash')
    equal(node.children[0].name, 'a', 'child 0 name')
    equal(node.children[0].hash, 6422626, 'child 0 hash')
    equal(node.children.length, 1, 'children length')
})

test('children 6', function() {
    var node = serializeHtml('<a><b></b></a>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 19267780, 'node hash')
    equal(node.children[0].name, 'b', 'child 0 name')
    equal(node.children[0].hash, 6488163, 'child 0 hash')
    equal(node.children.length, 1, 'children length')
})

test('children 7', function() {
    var node = serializeHtml('<a><b class="c"></b></a>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 240255805, 'node hash')
    equal(node.children[0].name, 'b', 'child 0 name')
    equal(node.children[0].hash, 189334236, 'child 0 hash')
    deepEqual(node.children[0].attributes, {class: 'c'}, 'child 0 attributes')
    equal(node.children.length, 1, 'children length')
})

test('collection 0', function() {
    var nodes = serializeHtml('<a/><b/><c/>').children
    hashify(nodes)
    equal(nodes[0].name, 'a', 'node 0 name')
    equal(nodes[0].hash, 6422626, 'node 0 hash')
    equal(nodes[0].parent.name, 'root' , 'node 0 parent')
    equal(nodes[1].name, 'b', 'node 1 name')
    equal(nodes[1].hash, 6488163, 'node 1 hash')
    equal(nodes[1].parent.name, 'root' , 'node 1 parent')
    equal(nodes[2].name, 'c', 'node 2 name')
    equal(nodes[2].hash, 6553700, 'node 2 hash')
    equal(nodes[2].parent.name, 'root' , 'node 2 parent')
    equal(nodes.length, 3, 'nodes length')
})

test('collection 1', function() {
    var nodes = serializeHtml('<a></a><b></b><c></c>').children
    hashify(nodes)
    equal(nodes[0].name, 'a', 'node 0 name')
    equal(nodes[0].hash, 6422626, 'node 0 hash')
    equal(nodes[0].parent.name, 'root' , 'node 0 parent')
    equal(nodes[1].name, 'b', 'node 1 name')
    equal(nodes[1].hash, 6488163, 'node 1 hash')
    equal(nodes[1].parent.name, 'root' , 'node 1 parent')
    equal(nodes[2].name, 'c', 'node 2 name')
    equal(nodes[2].hash, 6553700, 'node 2 hash')
    equal(nodes[2].parent.name, 'root' , 'node 2 parent')
    equal(nodes.length, 3, 'nodes length')
})

test('collection 2', function() {
    var node = serializeHtml('<a><b/><c/></a>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 38600999, 'node hash')
    equal(node.children[0].name, 'b', 'child 0 name')
    equal(node.children[0].hash, 6488163, 'child 0 hash')
    equal(node.children[1].name, 'c', 'child 1 name')
    equal(node.children[1].hash, 6553700, 'child 1 hash')
    equal(node.children.length, 2, 'children length')
})

test('collection 3', function() {
    var node = serializeHtml('<a><b></b><c/></a>').children[0]
    hashify(node)
    equal(node.name, 'a', 'node name')
    equal(node.hash, 38600999, 'node hash')
    equal(node.children[0].name, 'b', 'child 0 name')
    equal(node.children[0].hash, 6488163, 'child 0 hash')
    equal(node.children[1].name, 'c', 'child 1 name')
    equal(node.children[1].hash, 6553700, 'child 1 hash')
    equal(node.children.length, 2, 'children length')
})


