const vscode = require("vscode");

const { getConfiguration, definitionToSymbolInformation, buildDocumentSymbolTree } = require("./helpers");

// Definitions provider based on readtags command line utility
// https://docs.ctags.io/en/latest/man/readtags.1.html
class ReadtagsProvider {
    /**
     * @param {function(string, object): Promise<string[]>} exec
     */
    constructor(exec) {
        this.exec = exec;
    }

    /**
     * @param {vscode.TextDocument} document
     * @param {vscode.Position} position
     * @returns {Promise<vscode.Location[]>}
     */
    async provideDefinition(document, position) {
        const scope = vscode.workspace.getWorkspaceFolder(document.uri);
        if (scope === undefined) return [];

        const symbol = document.getText(document.getWordRangeAtPosition(position));
        const command = getConfiguration(scope).get("readtagsGoToDefinitionCommand");
        const cwd = scope.uri.fsPath;

        const definitions = await this.exec(`${command} '${symbol}'`, { cwd });
        return definitions
            .map(d => definitionToSymbolInformation(d, scope))
            .map(({ location }) => location);
    }

    /**
     * @param {string} query
     * @returns {Promise<vscode.SymbolInformation[]>}
     */
    async provideWorkspaceSymbols(query) {
        if (!query) return [];
        if (vscode.workspace.workspaceFolders === undefined) return [];

        const results = await Promise.all(vscode.workspace.workspaceFolders.map(async scope => {
            const command = getConfiguration(scope).get("readtagsGoToSymbolInWorkspaceCommand");
            const cwd = scope.uri.fsPath;
            const definitions = await this.exec(`${command} '${query}'`, { cwd, maxBuffer: Infinity });
            return definitions.map(d => definitionToSymbolInformation(d, scope));
        }));
        return results.flat();
    }

    /**
     * @param {vscode.TextDocument} document
     * @returns {Promise<vscode.DocumentSymbol[]>}
     */
    async provideDocumentSymbols(document) {
        const scope = vscode.workspace.getWorkspaceFolder(document.uri);
        const command = getConfiguration(scope).get("ctagsGoToSymbolInEditorCommand");
        const definitions = await this.exec(`${command} '${document.uri.fsPath}'`, {});
        // Return a DocumentSymbol tree so the Outline view can nest struct
        // members under their parent struct (SymbolInformation is always flat).
        return buildDocumentSymbolTree(definitions);
    }
}

module.exports = { ReadtagsProvider };
