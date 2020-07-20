# Ctags Companion

A Visual Studio Code symbols provider based on Ctags.

## Features

- Definition provider, i.e. "Go to Definition"
- Document symbol provider, i.e. outline and "Go to Symbol in File"
- Workspace symbol provider, i.e. "Go to Symbol in Workspace"

## Usage

To create a ctags file and index it invoke the "rebuild ctags" task (Terminal > Run Task... and select "Ctags Companion: rebuild ctags"). You may need to ensure `.vscode` directory is present in your project. On completion the task will trigger a "reindex" command which will read the tags file and create a symbol index in memory. After that's done, symbol definitions should become available in the editor.

## Settings

| Name                               | Default                                     | Description                                                                                                                                  |
|------------------------------------|---------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `ctags-companion.command`          | `"ctags -R --fields=+nKz -f .vscode/.tags"` | Command invoked in the "rebuild ctags" task. `nKz` fields are required.                                                                      |
| `ctags-companion.path`             | `".vscode/.tags"`                           | Location of the ctags file used when reindexing ctags.                                                                                       |
| `ctags-companion.documentSelector` | `{"scheme": "file"}`                        | [Document selector](https://code.visualstudio.com/api/references/vscode-api#DocumentSelector) object used when registering symbol providers. |
