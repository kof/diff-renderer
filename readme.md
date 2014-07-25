## Why

DOM is slow. It has always been slow. There is no hope this will change in the near future.

We want to display the changes of our state or data without thinking about "how to render".
jQuery has fixed inconsistencies for popular DOM methods and made our live easier for years. In the meantime requirements on web applications grew up. Complex application logic and push notifications led us to the need of bidirectional bindings between UI and data.

Projects like [react](https://github.com/facebook/react/) were born.

React is great. It solves lots of our problems, but the price is high. It comes at a price of "no compatibility" to all the things we have build in the last decade.

## Goal

DiffRenderer is here to solve 1 issue - rendering of data changes to the DOM at 60fps.

Feel free to use any other project for events handling, templates, animations etc.

## How

1. It accepts a snapshot of your state in html or json format. You can use any template engine or none.
1. It calculates the difference to the cached state of the dom.
1. Intelligently renders the difference by only modifying/adding/removing nodes it has to.
1. Maintains a pool of DOM nodes and reuses them.

## Use cases

1. Replacement for jQuery's dom manipulation methods and any manual dom manipulation.
1. Easy RESTful http API implementation:
   Client sends an object to the server, server validates it, client gets cleaned object back. With DiffRenderer we can apply the new one to the DOM without any checks.
1. Full bidirectional binding. For this you need to add the part for handling events and changing the state/data objects manually.
1. Real time data manipulation / rendering.

## Playground

Visit [playground](//kof.github.com/diff-renderer/demo/playground.html) to see it in action.

## Bench

- html parser - 200kb of html parsed in 15ms to json on my mb air.
```
    npm i
    make bench
```
- jsperf of html parser vs. dom parsers http://jsperf.com/domparser-vs-jsparser
- manual html parser memory test: open ./test/memory.html, observe your engines memory, click some times on buttons and see what happens

## Test

    npm i
    make test
