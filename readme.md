## Html diff based dom renderer.

Goal - `div.innerHTML` which renders just the difference. Hopefully somewhere in the future, browsers will do this for us, but for now ...

- no data-bindings required
- no events library included - use whatever you want
- no templating engine included - use whatever you want
- no virtual dom, just a snapshot as plain a javascript object for diffing

Currently experimental stage. Not ready for use in any environment.

## How it works

1. Serialize DOM elements of given container for later diffing.
1. On .render call, serialize html to the same format.
1. Find the differences.
1. Apply differences to the DOM.

## Todo

- add more tests for html serializer, port tests from some well tested parsers
- create better diff
- write diff renderer


## Bench

- htmlToJson - 200kb of html seralized in 15ms to json on mb air.

    npm i
    make bench

## Test

    npm i
    make test


