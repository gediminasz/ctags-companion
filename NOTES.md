# Development notes

## Release checklist

1. Bump version in `package.json` and `npm install`.
    * Version should be in the [CalVer](https://calver.org/) format of `YYYY.MM.MICRO`, e.g. `2023.9.0`, `2023.9.1`, `2023.9.2` and so on. The final number (MICRO) is sequential and does not correspond to a calendar day.
    * A pre-release version may look something like this: `2023.9.0-beta`.
1. Ensure `CHANGELOG.md` is up to date.
    * Change the "Unreleased" heading to the version you are about to release.
1. Manually test a few of the [test projects](https://github.com/gediminasz/just-testing-examples).
1. `make publish`
1. Create a release together with a new tag in GitHub.
