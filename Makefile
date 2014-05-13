build:
	node_modules/browserify/bin/cmd.js -e ./index.js -o dist/diff-renderer.js -s DiffRenderer
	xpkg .

bench:
	node bench

test:
	qunit -c serializeHtml:./lib/serialize-html.js -d hashify:./lib/hashify.js -t ./test/serialize-html.js --cov

.PHONY: build bench test
