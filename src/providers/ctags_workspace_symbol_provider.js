const vscode = require("vscode");

const { definitionToSymbolInformation, getConfiguration } = require("../helpers");
const { getIndexForScope } = require("../index");

class CtagsWorkspaceSymbolProvider {
    constructor(extension) {
        this.extension = extension;
    }

    async provideWorkspaceSymbols(query) {
        if (!query) return;

        const matcher = this.getMatcher(query);

        const results = await Promise.all(vscode.workspace.workspaceFolders.map(async scope => {
            const { symbolIndex } = await getIndexForScope(this.extension, scope);
            const definitions = Array.from(this.findDefinitions(symbolIndex, matcher));
            return definitions.map(d => definitionToSymbolInformation(d, scope));
        }));
        return results.flat();
    }

    *findDefinitions(symbolIndex, matcher) {
        for (const [symbol, definitions] of symbolIndex) {
            if (matcher(symbol)) {
                yield* definitions;
            }
        }
    }

    getMatcher(query) {
        if (getConfiguration().get("fuzzyMatchingEnabled")) {
            const regexp = new RegExp('.*' + query.toLowerCase().split('').join('.*') + '.*');
            return symbol => regexp.test(symbol.toLowerCase());
        } else {
            return symbol => symbol.toLowerCase().includes(query.toLowerCase());
        }
    }
}

module.exports = { CtagsWorkspaceSymbolProvider };
