var a = require('assert'),
    diff = require('../lib/diff')

// Identic
a.equal(diff({}, {}), null)
a.equal(diff({a: 1}, {a: 1}), null)
a.equal(diff({a: 1, b: [1,2,3]}, {a: 1, b: [1,2,3]}), null)

// Primitives
a.deepEqual(diff({a: 1}, {}), {a: {value: 1, type: 'create'}})
a.deepEqual(diff({a: 2}, {a: 1}), {a: {value: 2, type: 'update'}})
a.deepEqual(diff({a: 2, b: 1}, {a: 1, b: 2}), {a: {value: 2, type: 'update'}, b: {value: 1, type: 'update'}})
a.deepEqual(diff({}, {a: 1}), {a: {type: 'delete'}})
a.deepEqual(diff({}, {a: 1, b: 1}), {a: {type: 'delete'}, b: {type: 'delete'}})
a.deepEqual(diff({a: [1, 2]}, {}), {a: {value: [1, 2], type: 'create'}})
a.deepEqual(diff({a: [{b: 1}, {c: 2}]}, {}), {a: {value: [{b: 1}, {c: 2}], type: 'create'}})

// Multilevel
a.deepEqual(diff({a: 1, b: {c: 1}}, {}), {
    a: {value: 1, type: 'create'},
    b: {value: {c: 1}, type: 'create'},
})
a.deepEqual(diff({a: 1, b: {c: 2}}, {b: {c: 1}}), {
    a: {value: 1, type: 'create'},
    b: {c: {value: 2, type: 'update'}}
})


console.log('diff ok')
