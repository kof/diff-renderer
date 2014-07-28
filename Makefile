build:
	node_modules/browserify/bin/cmd.js -e ./index.js -o dist/diff-renderer.js -s DiffRenderer
	xpkg .

bench:
	node bench

test:
	node_modules/.bin/qunit -c DiffRenderer:./index.js -t ./test/serialize-html.js --cov

.PHONY: build bench test
