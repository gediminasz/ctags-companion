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

ci:
	npm audit
	npm install
	npm run test -- --ci --coverage --verbose

docs:
	python format_settings.py
