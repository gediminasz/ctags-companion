# Change Log

## Unreleased

- `readtags` and `ctags` execution errors are now logged to "Ctags Companion" output channel instead of toast notifications.

## 2023.10.2

- Removed reference to no longer functional reindex command.

## 2023.10.1

- Updated settings documentation.

## 2023.10.0

- Execute shell commands under `powershell.exe` on Windows. This addresses Command Prompt not supporting queries wrapped in single quotes.

## 2023.9.0

- Fixed `readtags` command failing when a symbol query contains non-alphanumeric characters.

## 2023.8.2

- Changed default setting values for better compatibility with different `readtags` implementations:
    - `readtagsGoToDefinitionCommand`: from `readtags --extension-fields --line-number` to `readtags -en`
    - `readtagsGoToSymbolInWorkspaceCommand`: from `readtags --extension-fields --line-number --prefix-match --icase-match` to `readtags -enpi`

## 2023.8.1

- Fixed workspace symbol lookup failing when `readtags` returns too many results.

## 2023.8.0

- Switched to using the default `tags` file location rather than `.vscode/.tags`
- Replaced in-memory symbol index with more efficient `readtags`.

## 2023.3.0

- Added outline and "go to symbol in editor" capability to `readtags` provider.
- Added setting `companion.ctagsGoToSymbolInEditorCommand`.

## 2023.1.0

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
