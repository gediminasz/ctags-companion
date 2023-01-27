const { exec } = require('child_process');
const { promisify } = require('util');

const vscode = require("vscode");

const { determineScope, getConfiguration, definitionToSymbolInformation } = require("../helpers");

// Definitions provider based on readtags command line utility
// https://docs.ctags.io/en/latest/man/readtags.1.html
class ReadtagsProvider {
    constructor(extension) {
        this.extension = extension;
    }

    async provideDefinition(document, position) {
        const symbol = document.getText(document.getWordRangeAtPosition(position));
        const scope = determineScope(document);
        const command = getConfiguration(scope).get("readtagsGoToDefinitionCommand");
        const cwd = scope.uri.fsPath;

        try {
            const { stdout } = await promisify(exec)(`${command} ${symbol}`, { cwd });
            const definitions = stdout.trim().split('\n');  // TODO handle stdout == ''
            if (definitions) {
                return definitions
                    .map(definition => definitionToSymbolInformation(definition, scope))
                    .map(({ location }) => location);
            }
        } catch ({ stderr }) {
            this.extension.showErrorMessage(stderr);
        }
    }

    async provideWorkspaceSymbols(query) {
        if (!query) return;

        const results = await Promise.all(vscode.workspace.workspaceFolders.map(async scope => {
            const command = getConfiguration(scope).get("readtagsGoToSymbolInWorkspaceCommand");
            const cwd = scope.uri.fsPath;
            try {
                const { stdout } = await promisify(exec)(`${command} ${query}`, { cwd });
                const definitions = stdout.trim().split('\n');  // TODO handle stdout == ''
                return definitions.map(d => definitionToSymbolInformation(d, scope));
            } catch ({ stderr }) {
                this.extension.showErrorMessage(stderr);
            }
        }));
        return results.flat();
    }
}

module.exports = { ReadtagsProvider };
