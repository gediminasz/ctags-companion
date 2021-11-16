const vscode = require("vscode");

const { definitionToSymbolInformation, getConfiguration } = require("../helpers");
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

        const matcher = this.getMatcher(query);

        return indexes.flatMap(([scope, { symbolIndex }]) => {
            return symbolIndex
                .filter(([symbol]) => matcher(symbol.toLowerCase()))
                .flatMap(([_, definitions]) => definitions)
                .map(definition => definitionToSymbolInformation(definition, scope));
        });
    }

    getMatcher(query) {
        if (getConfiguration().get("fuzzyMatchingEnabled")) {
            const regexp = new RegExp('.*' + query.toLowerCase().split('').join('.*') + '.*');
            return symbol => regexp.test(symbol);
        } else {
            return symbol => symbol.includes(query.toLowerCase());
        }
    }
}

module.exports = { CtagsWorkspaceSymbolProvider };
