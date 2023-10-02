# Development notes

## Pre-release checklist

1. Change version in `package.json` to something like `2023.9.0-beta`
1. `npm install`
1. `make package`
1. `code --install-extension ctags-companion-2023.9.0-beta.vsix`
1. Manually test the extension on a few projects
    1. Rebuild ctags task
    1. Go to Symbol in Workspace
    1. Go to Symbol in File
    1. Go to Definition

## Release checklist

1. Bump version in `package.json` and `npm install`.
    * Version should be in the [CalVer](https://calver.org/) format of `YYYY.MM.MICRO`, e.g. `2023.9.0`, `2023.9.1`, `2023.9.2` and so on. The final number (MICRO) is sequential and does not correspond to a calendar day.
    * A pre-release version may look something like this: `2023.9.0-beta`.
1. Ensure `CHANGELOG.md` is up to date.
    * Change the "Unreleased" heading to the version you are about to release.
1. Commit changes.
1. `make publish`
1. Create a release together with a new tag in GitHub.
