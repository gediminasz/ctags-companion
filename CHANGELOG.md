# Change Log

## Unreleased

- Improved stability when indexing large ctags files.
- Added experimental definitions provider based on `readtags`. Compared to an in-memory index it is faster and more memory efficient. This provider can enabled by setting `ctags-companion.readtagsEnabled` to `true`.
- Added settings `ctags-companion.readtagsGoToDefinitionCommand` and `ctags-companion.readtagsGoToSymbolInWorkspaceCommand`.

## 2022.12.0

- Running ctags with `--fields=+nKz` is no longer required.

## 2021.11.1

- Added icon.

## 2021.11.0

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
