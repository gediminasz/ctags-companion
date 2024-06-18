test:
	npm test

update:
	rm -rf node_modules
	rm package-lock.json
	npm add --save-dev jest@latest @vscode/vsce@latest ovsx@latest

lock:
	npm install --package-lock-only

package: ci
	npx vsce package

publish: package
	npx vsce publish
	npx ovsx publish

ci:
	npm audit
	npm install
	npm run test -- --ci --coverage --verbose

docs:
	python format_settings.py
