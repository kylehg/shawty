.PHONY: run dev test

node_modules:
	npm install

run: node_modules
	./node_modules/.bin/nf start

dev: node_modules
	NODE_ENV=development ./node_modules/.bin/nf start

test: node_modules
	NODE_ENV=test mocha
