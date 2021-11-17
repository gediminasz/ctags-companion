update:
	npm add --include=dev jest@latest

package:
	vsce package

publish: package
	vsce publish
