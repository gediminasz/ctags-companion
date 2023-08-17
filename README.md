# Ctags Companion

A Visual Studio Code symbols provider based on Ctags. This extension provides the following capabilities:

- [Go to Definition](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition) (F12)
- [Go to Symbol in File](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-symbol) (⇧⌘O) as well as [the Outline](https://code.visualstudio.com/docs/getstarted/userinterface#_outline-view)
- [Go to Symbol in Workspace](https://code.visualstudio.com/docs/editor/editingevolved#_open-symbol-by-name) (⌘T)

## Usage

First of all, make sure you have [Universal Ctags](https://github.com/universal-ctags/ctags) installed.

In order to provide symbol definitions a `tags` file must be present. You can generate it using the "rebuild ctags" task (Terminal > Run Task... and select "Ctags Companion: rebuild ctags"). It will run [ctags](https://docs.ctags.io/en/latest/man/ctags.1.html) and generate a `tags` file inside your project directory. The extension will then use [readtags](https://docs.ctags.io/en/latest/man/readtags.1.html) to perform symbol definition lookup.

## Settings

### `ctags-companion.command`

Default: `"ctags -R --fields=+nKz"`

Command to generate the tags file. This command is used by the `Terminal > Run Task... > Ctags Companion: rebuild tags` task.

```json
"ctags-companion.command": "ctags -R --fields=+nKz"
```

### `ctags-companion.documentSelector`

Default: `{"scheme": "file"}`

Document selector object used when registering symbol providers, read more at https://code.visualstudio.com/api/references/vscode-api#DocumentSelector.

```json
"ctags-companion.documentSelector": {"scheme": "file"}
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

## FAQ

### How to install Universal Ctags?

* macOS: `brew install universal-ctags`
* Ubuntu: `apt install universal-ctags` or `snap install universal-ctags`
* Windows: `winget install 'Universal Ctags'`
