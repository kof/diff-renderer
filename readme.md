## What is DiffRenderer

DiffRenderer is a rendering component for your views, think of smart .innerHTML which renders the difference.

DiffRenderer is here to solve 1 issue - rendering of data changes to the DOM at 60fps.

DiffRenderer is designed in first place to play nicely with any library and web components.

DiffRenderer will dramatically simplify your view logic in non-trivial tasks.

Feel free to use any other project for events handling, templates, animations etc.

## Why

DOM is slow. It has always been slow. There is no hope this will change in the near future.

We want to display the changes of our state or data without thinking about "how to render".
jQuery has fixed inconsistencies for popular DOM methods and made our live easier for years. In the meantime requirements on web applications grew up. Complex application logic and push notifications led us to the need of bidirectional bindings between UI and data.

Projects like [react](https://github.com/facebook/react/) were born.

React is great. It solves lots of our problems, but the price is high. It comes at a price of "no compatibility" to all the things we have build in the last decade.

## Use cases

1. Replacement for jQuery's dom manipulation methods and any direct dom manipulation.
1. Easy RESTful http API implementation:
   Client sends an object to the server, server validates it, client gets cleaned object back. With DiffRenderer we can apply the new one to the DOM without any checks.
1. Full bidirectional binding. For this you need to add the part for handling events and changing the state/data objects manually.
1. Real time data manipulation / rendering.

## How

1. It accepts a snapshot of your state in html or json format. You can use any template engine or none.
1. It calculates the difference to the cached state of the dom.
1. Intelligently renders the difference by only modifying/adding/removing nodes it has to.
1. It reuses DOM elements.

## Gotchas

1. Don't attach listeners to the elements within renderer container. Do event delegation.
1. Don't change elements directly, use DiffRenderer. If you (or some lib) changed an element directly - refresh DiffRenderer.

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

## Api

- Use [requestAnimationFrame shim](https://github.com/kof/animation-frame) for older browsers.

## Test

[Open in browser the suite](./test/index.html)
