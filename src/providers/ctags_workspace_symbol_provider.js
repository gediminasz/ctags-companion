const vscode = require("vscode");

const { definitionToSymbolInformation } = require("../helpers");
const { getIndexForScope } = require("../index");

class CtagsWorkspaceSymbolProvider {
    constructor(stash) {
        this.stash = stash;
    }

    async provideWorkspaceSymbols(query) {
        if (!query) return;

        const indexes = await Promise.all(
            vscode.workspace.workspaceFolders.map(
                async scope => [scope, await getIndexForScope(this.stash, scope)]
            )
        );

        const regexp = new RegExp('.*' + query.toLowerCase().split('').join('.*') + '.*');

        return indexes.flatMap(([_scope, { symbolIndex }]) => {
            return Object.entries(symbolIndex)
                .filter(([symbol]) => regexp.test(symbol.toLowerCase()))
                .flatMap(([_, definitions]) => definitions)
                .map(definitionToSymbolInformation);
        });
    }
}

module.exports = { CtagsWorkspaceSymbolProvider };
