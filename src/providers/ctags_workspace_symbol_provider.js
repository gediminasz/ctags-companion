const vscode = require("vscode");

const { definitionToSymbolInformation, getConfiguration } = require("../helpers");
const { getIndexForScope } = require("../index");

class CtagsWorkspaceSymbolProvider {
    constructor(extension) {
        this.extension = extension;
    }

    provideWorkspaceSymbols(query) {
        if (!query) return;

        const matcher = this.getMatcher(query);

        return vscode.workspace.workspaceFolders.flatMap(scope => {
            const { symbolIndex } = getIndexForScope(this.extension, scope);
            const definitions = this.findDefinitions(symbolIndex, matcher);
            return Array.from(definitions).map(d => definitionToSymbolInformation(d, scope));
        });
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
