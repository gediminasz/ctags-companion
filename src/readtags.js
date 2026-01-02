const vscode = require("vscode");

const { getConfiguration, definitionToSymbolInformation } = require("./helpers");

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

        const symbol = document.getText(document.getWordRangeAtPosition(position));
        const command = getConfiguration(scope).get("readtagsGoToDefinitionCommand");

        // TODO FIXME scope is undefined when editing a file that is outside of workspace, e.g. it is on desktop or so
        // @ts-expect-error
        const cwd = scope.uri.fsPath;

        const definitions = await this.exec(`${command} '${symbol}'`, { cwd });
        return definitions
            .map(d => definitionToSymbolInformation(d, scope))
            .map(({ location }) => location);
    }

    /**
     * @param {string} query
     * @returns {Promise<vscode.SymbolInformation[] | undefined>}
     */
    async provideWorkspaceSymbols(query) {
        if (!query) return;

        // TODO FIXME handle vscode.workspace.workspaceFolders being undefined when no workspace folder is open
        // @ts-expect-error
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
     * @returns {Promise<vscode.SymbolInformation[]>}
     */
    async provideDocumentSymbols(document) {
        const scope = vscode.workspace.getWorkspaceFolder(document.uri);
        const command = getConfiguration(scope).get("ctagsGoToSymbolInEditorCommand");
        const definitions = await this.exec(`${command} '${document.uri.fsPath}'`, {});
        return definitions.map(d => definitionToSymbolInformation(d));
    }
}

module.exports = { ReadtagsProvider };
