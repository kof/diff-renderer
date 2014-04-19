build:
	node_modules/browserify/bin/cmd.js -e ./index.js -o dist/diffRenderer.js -s DiffRenderer
	xpkg .

bench:
	node bench

test:
	node ./test/htmlToJson

.PHONY: build bench test
