# Change Log

## Unreleased

- Improved performance of tags file parsing.
- Fixed a bug when symbols matching certain JS methods (e.g. `hasOwnProperty`) would break the extension. Thanks to @ocoka for reporting!

## 2021.1.0

- Added a warning message when `ctags-companion.command` setting is blank. Thanks, @crawler!

## 2020.12.0

- Added support for most of the ctags symbol kinds. Thanks, @hirooih!

## 2020.10.0

- Added fuzzy matching to workspace symbol provider. It can be disabled by setting `ctags-companion.fuzzyMatchingEnabled` to `false`.
- Added support for absolute paths in the tags file. Thanks, @crawler!

## 2020.9.0

- Changed missing ctags file notification to be less annoying.

## 2020.4.2

- Really fixed broken "reindex" command.

## 2020.4.1

- Fixed broken "reindex" command.

## 2020.4.0

- Added multi root workspaces support.
