test:
	npm test

update:
	npm add --include=dev jest@latest

lock:
	npm install --package-lock-only

package:
	vsce package

publish: package
	vsce publish
