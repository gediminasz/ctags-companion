const vscode = require("vscode");

const { determineScope, getConfiguration, definitionToSymbolInformation } = require("./helpers");

// Definitions provider based on readtags command line utility
// https://docs.ctags.io/en/latest/man/readtags.1.html
class ReadtagsProvider {
    constructor(exec) {
        this.exec = exec;
    }

    async provideDefinition(document, position) {
        const symbol = document.getText(document.getWordRangeAtPosition(position));
        const scope = determineScope(document);
        const command = getConfiguration(scope).get("readtagsGoToDefinitionCommand");
        const cwd = scope.uri.fsPath;

        const definitions = await this.exec(`${command} ${symbol}`, { cwd });
        return definitions
            .map(d => definitionToSymbolInformation(d, scope))
            .map(({ location }) => location);
    }

    async provideWorkspaceSymbols(query) {
        if (!query) return;

        const results = await Promise.all(vscode.workspace.workspaceFolders.map(async scope => {
            const command = getConfiguration(scope).get("readtagsGoToSymbolInWorkspaceCommand");
            const cwd = scope.uri.fsPath;
            const definitions = await this.exec(`${command} ${query}`, { cwd });
            return definitions.map(d => definitionToSymbolInformation(d, scope));
        }));
        return results.flat();
    }

    async provideDocumentSymbols(document) {
        const scope = determineScope(document);
        const command = getConfiguration(scope).get("ctagsGoToSymbolInEditorCommand");
        const relativePath = vscode.workspace.asRelativePath(document.uri, false);
        const cwd = scope.uri.fsPath;

        const definitions = await this.exec(`${command} ${relativePath}`, { cwd });
        return definitions.map(d => definitionToSymbolInformation(d, scope));
    }
}

module.exports = { ReadtagsProvider };
