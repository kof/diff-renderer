build:
	node_modules/browserify/bin/cmd.js -e ./index.js -o dist/diff-renderer.js -s DiffRenderer
	xpkg .

bench:
	node bench

test:
	qunit -c htmlToJson:./lib/htmlToJson.js -d addIds:./lib/addIds.js -t ./test/htmlToJson.js

.PHONY: build bench test
