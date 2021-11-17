update:
	npm add --include=dev jest@latest

package:
	vsce package

publish:
	vsce publish
