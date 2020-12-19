const vscode = require("vscode");

const { determineScope, definitionToSymbolInformation } = require("../helpers");
const { getIndexForScope } = require("../index");

class CtagsDocumentSymbolProvider {
    constructor(stash) {
        this.stash = stash;
    }

    async provideDocumentSymbols(document) {
        const relativePath = vscode.workspace.asRelativePath(document.uri, false);
        const scope = determineScope(document);
        const { documentIndex } = await getIndexForScope(this.stash, scope);
        const definitions = documentIndex[relativePath];
        if (definitions) {
            return definitions.map(definitionToSymbolInformation);
        }
    }
}

module.exports = { CtagsDocumentSymbolProvider };
