test:
	npm test

update:
	npm add --save-dev jest@latest @vscode/vsce@latest ovsx@latest

lock:
	npm install --package-lock-only

package: ci
	vsce package

publish: package
	vsce publish

ci:
	npm audit
	npm install
	npm run test -- --ci --coverage --verbose

docs:
	python format_settings.py
