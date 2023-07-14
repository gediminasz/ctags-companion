# Ctags Companion

A Visual Studio Code symbols provider based on Ctags. This extension provides the following capabilities:

- [Go to Definition](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition) (F12)
- [Go to Symbol in File](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-symbol) (⇧⌘O) as well as [the Outline](https://code.visualstudio.com/docs/getstarted/userinterface#_outline-view)
- [Go to Symbol in Workspace](https://code.visualstudio.com/docs/editor/editingevolved#_open-symbol-by-name) (⌘T)

## Usage

To create a ctags file and index it invoke the "rebuild ctags" task (Terminal > Run Task... and select "Ctags Companion: rebuild ctags"). By default it will generate a `tags` file in your project root. On completion the task will trigger a "reindex" command which will read the tags file and create a symbol index in memory. After that's done, symbol definitions should become available in the editor.

## Settings

### `ctags-companion.command`

Default: `"ctags -R --fields=+nKz"`

Command to generate the tags file. This command is used by the `Terminal > Run Task... > Ctags Companion: rebuild tags` task.

```json
"ctags-companion.command": "ctags -R --fields=+nKz"
```

### `ctags-companion.path`

Default: `"tags"`

Location of the ctags file.

```json
"ctags-companion.path": "tags"
```

### `ctags-companion.documentSelector`

Default: `{"scheme": "file"}`

Document selector object used when registering symbol providers, read more at https://code.visualstudio.com/api/references/vscode-api#DocumentSelector.

```json
"ctags-companion.documentSelector": {"scheme": "file"}
```

### `ctags-companion.fuzzyMatchingEnabled`

Default: `true`

Should fuzzy matching be used in workspace symbols provider.

```json
"ctags-companion.fuzzyMatchingEnabled": true
```

### `ctags-companion.readtagsEnabled`

Default: `false`

Should `readtags` command be used for looking up symbol definitions. This option is fast and memory efficient, however it is still experimental.

```json
"ctags-companion.readtagsEnabled": false
```

### `ctags-companion.readtagsGoToDefinitionCommand`

Default: `"readtags --extension-fields --line-number"`

When `readtags` is enabled, this command is used for the "go to definition" feature (i.e. F12 or Ctrl+click).

```json
"ctags-companion.readtagsGoToDefinitionCommand": "readtags --extension-fields --line-number"
```

### `ctags-companion.readtagsGoToSymbolInWorkspaceCommand`

Default: `"readtags --extension-fields --line-number --prefix-match --icase-match"`

When `readtags` is enabled, this command is used for the "go to symbol in workspace" feature (i.e. Ctrl+T).

```json
"ctags-companion.readtagsGoToSymbolInWorkspaceCommand": "readtags --extension-fields --line-number --prefix-match --icase-match"
```

### `ctags-companion.ctagsGoToSymbolInEditorCommand`

Default: `"ctags --fields=+nKz -f -"`

When `readtags` is enabled, this command is used for the outline and the "go to symbol in editor" feature (i.e. Ctrl+Shift+O).

```json
"ctags-companion.ctagsGoToSymbolInEditorCommand": "ctags --fields=+nKz -f -"
```
