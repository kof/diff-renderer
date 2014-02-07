build:
	node_modules/browserify/bin/cmd.js -e ./index.js -o build/diffRenderer.js -s DiffRenderer

bench:
	node bench

test:
	node ./test/htmlToJson
	node ./test/diff

.PHONY: build bench test
