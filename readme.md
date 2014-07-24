## Why

DOM is slow. It has always been slow. There is no hope this will change in the near future.

We want to display the changes of our state or data without thinking about "how to render".
jQuery has fixed inconsistencies for popular DOM methods. This made our live easier for years. In the meantime requirements on web applications grew up. Complex application logic and push notifications led us to the need of bidirectional bindings between UI and data.

Projects like [react](https://github.com/facebook/react/) were born.

React is great. It solves lots of our problems, but the price is high. It comes at a price of "no compatibility" to all the things we have build in the last decade.

## Goal

diff-renderer is here to solve 1 issue - rendering of data changes to the DOM at 60fps.

Events handling, template engines or animations are NOT part of this project.

## How

1. By accepting the DOM as a render api, not something we can change all the time.
1. Accepts a snapshot of your state represented as html or json. You can use any template engine or none.
1. Calculates the difference to the state in the dom.
1. Intelligently renders the difference by only modifying/adding/removing nodes we have to.
1. Maintains a pool of DOM nodes and reuses them.
1. Benchmark driven development

## Playground

Visit [playground](demo/playground.html) to see it in action.

## Bench

- html parser - 200kb of html parsed in 15ms to json on my mb air.
```
    npm i
    make bench
```
- jsperf of html parser vs. all the dom parsers http://jsperf.com/domparser-vs-jsparser
- html parser manual memory bench: open ./test/memory.html , observe your engines memory, click lots of times on buttons and see what happens

## Test

    npm i
    make test


