function getView() {
    var element = document.createElement('div')
    var renderer = new DiffRenderer(element)
    return {
        render: function(html) {
            renderer.update(html)
            DiffRenderer.render()
        },
        element: element
    }
}

module('DiffRenderer')

test('render a tag', function() {
    var view = getView()
    view.render('<a/>')
    equal(view.element.innerHTML, '<a></a>', 'self closing')
    view.render('<a></a>')
    equal(view.element.innerHTML, '<a></a>', 'not self closing')
})

test('render a text node', function() {
    var view = getView()
    view.render('abc')
    equal(view.element.innerHTML, 'abc', 'without spaces')
    view.render('  abc  ')
    equal(view.element.innerHTML, '  abc  ', 'with spaces')
})

test('add an attribute', function() {
    var view = getView()
    view.render('<a/>')
    view.render('<a class="b"/>')
    equal(view.element.innerHTML, '<a class="b"></a>', 'add class')
    view.render('<a class="b" id="c"/>')
    equal(view.element.innerHTML, '<a class="b" id="c"></a>', 'add id')
    view.render('<a class="b" id="c" href=""/>')
    equal(view.element.innerHTML, '<a class="b" id="c" href=""></a>', 'add empty href')
    view.render('<a class="b" id="c" href="" disabled/>')
    equal(view.element.innerHTML, '<a class="b" id="c" href="" disabled=""></a>', 'add disabled')
})

test('add an attribute', function() {
    var view = getView()
    view.render('<a/>')
    view.render('<a class="b"/>')
    equal(view.element.innerHTML, '<a class="b"></a>', 'add class')
    view.render('<a class="b" id="c"/>')
    equal(view.element.innerHTML, '<a class="b" id="c"></a>', 'add id')
    view.render('<a class="b" id="c" href=""/>')
    equal(view.element.innerHTML, '<a class="b" id="c" href=""></a>', 'add empty href')
    view.render('<a class="b" id="c" href="" disabled/>')
    equal(view.element.innerHTML, '<a class="b" id="c" href="" disabled=""></a>', 'add disabled')
})

test('change an attribute', function() {
    var view = getView()
    view.render('<a class="b"/>')
    view.render('<a class="c d"/>')
    equal(view.element.innerHTML, '<a class="c d"></a>')
})

test('change an attributes', function() {
    var view = getView()
    view.render('<a class="b" id="e"/>')
    view.render('<a class="c d" id="f"/>')
    equal(view.element.innerHTML, '<a class="c d" id="f"></a>')
})

test('remove an attribute', function() {
    var view = getView()
    view.render('<a class="b"/>')
    view.render('<a/>')
    equal(view.element.innerHTML, '<a></a>')
})

test('remove all attributes', function() {
    var view = getView()
    view.render('<a class="b" id="c"/>')
    view.render('<a/>')
    equal(view.element.innerHTML, '<a></a>')
})

test('remove one of attributes', function() {
    var view = getView()
    view.render('<a class="b" id="c"/>')
    view.render('<a id="c"/>')
    equal(view.element.innerHTML, '<a id="c"></a>')
})

test('change text node text', function() {
    var view = getView()
    view.render('abc')
    view.render('a')
    equal(view.element.innerHTML, 'a')
})

test('change text node text within a tag', function() {
    var view = getView()
    view.render('<a>aaa</a>')
    view.render('<a>a</a>')
    equal(view.element.innerHTML, '<a>a</a>')
})

test('replace tag by another tag', function() {
    var view = getView()
    view.render('<a/>')
    view.render('<b/>')
    equal(view.element.innerHTML, '<b></b>')
})

test('replace multiple tags by 1 other tag', function() {
    var view = getView()
    view.render('<a/><b/>')
    view.render('<c/>')
    equal(view.element.innerHTML, '<c></c>')
})

test('replace multiple tags by 1 text node', function() {
    var view = getView()
    view.render('<a/><b/>')
    view.render('aaa')
    equal(view.element.innerHTML, 'aaa')
})

test('replace multiple tags by multiple tags', function() {
    var view = getView()
    view.render('<a/><b/>')
    view.render('<c/><d/>')
    equal(view.element.innerHTML, '<c></c><d></d>')
})

test('replace first tag by another one', function() {
    var view = getView()
    view.render('<a/><b/>')
    view.render('<c/><b/>')
    equal(view.element.innerHTML, '<c></c><b></b>')
})

test('replace first tag by text node', function() {
    var view = getView()
    view.render('<a/><b/>')
    view.render('a<b/>')
    equal(view.element.innerHTML, 'a<b></b>')
})

test('replace last tag by another one', function() {
    var view = getView()
    view.render('<a/><b/>')
    view.render('<a/><c/>')
    equal(view.element.innerHTML, '<a></a><c></c>')
})

test('replace middle tag by another one', function() {
    var view = getView()
    view.render('<a/><b/><c/>')
    view.render('<a/><d/><c/>')
    equal(view.element.innerHTML, '<a></a><d></d><c></c>')
})

test('append a tag', function() {
    var view = getView()
    view.render('<a/>')
    view.render('<a><b/></a>')
    equal(view.element.innerHTML, '<a><b></b></a>')
})

test('append a text node', function() {
    var view = getView()
    view.render('<a/>')
    view.render('<a>b</a>')
    equal(view.element.innerHTML, '<a>b</a>')
})

test('prepend a tag', function() {
    var view = getView()
    view.render('<a/>')
    view.render('<b/><a/>')
    equal(view.element.innerHTML, '<b></b><a></a>')
})

test('prepend multiple tags', function() {
    var view = getView()
    view.render('<a/>')
    view.render('<d/><c/><b/><a/>')
    equal(view.element.innerHTML, '<d></d><c></c><b></b><a></a>')
})

test('prepend a text node', function() {
    var view = getView()
    view.render('<a c="b"/>')
    view.render('b<a c="b"/>')
    equal(view.element.innerHTML, 'b<a c="b"></a>')
})

test('insert a tag after', function() {
    var view = getView()
    view.render('<a/>')
    view.render('<a/><b/>')
    equal(view.element.innerHTML, '<a></a><b></b>')
})

test('insert multiple tags after', function() {
    var view = getView()
    view.render('<a/>')
    view.render('<a/><b/><c/><d/>')
    equal(view.element.innerHTML, '<a></a><b></b><c></c><d></d>')
})

test('insert multiple tags in the middle', function() {
    var view = getView()
    view.render('<a/><b/>')
    view.render('<a/><c/><d/><b/>')
    equal(view.element.innerHTML, '<a></a><c></c><d></d><b></b>')
})

test('migrate children', function() {
    var view = getView()
    view.render('<a>a</a><b/>')
    view.render('<b>a</b><a/>')
    equal(view.element.innerHTML, '<b>a</b><a></a>')
})

test('remove text node within a tag', function() {
    var view = getView()
    view.render('<a>abc</a>')
    view.render('<a></a>')
    equal(view.element.innerHTML, '<a></a>')
})

test('remove text node', function() {
    var view = getView()
    view.render('abc')
    view.render('')
    equal(view.element.innerHTML, '')
})

test('remove first tag', function() {
    var view = getView()
    view.render('<a/><b/><c/>')
    view.render('<b/><c/>')
    equal(view.element.innerHTML, '<b></b><c></c>')
})

test('remove middle tag', function() {
    var view = getView()
    view.render('<a/><b/><c/>')
    view.render('<a/><c/>')
    equal(view.element.innerHTML, '<a></a><c></c>')
})

test('remove last tag', function() {
    var view = getView()
    view.render('<a/><b/><c/>')
    view.render('<a/><b/>')
    equal(view.element.innerHTML, '<a></a><b></b>')
})

test('remove last tag', function() {
    var view = getView()
    view.render('<a/><b/><c/>')
    view.render('<a/><b/>')
    equal(view.element.innerHTML, '<a></a><b></b>')
})

test('allow nesting of renderers', function() {
    var element1 = document.createElement('div')
    element1.className = '1'
    var element2 = document.createElement('div')
    element2.className = '2'
    var element3 = document.createElement('div')
    element3.className = '3'
    element1.appendChild(element2)
    element2.appendChild(element3)

    var renderer1 = new DiffRenderer(element1)
    var renderer2 = new DiffRenderer(element2)

    ok(renderer1.node.children[0] === renderer2.node)
    ok(renderer1.node.children[0].children[0] === renderer2.node.children[0])
})
