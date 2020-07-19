const path = require('path');
const vscode = require("vscode");

const { determineScope, toSymbolKind } = require("../helpers");
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
        if (!definitions) return;

        return definitions.map(({ symbol, file, line, kind, container }) =>
            new vscode.SymbolInformation(
                symbol,
                toSymbolKind(kind),
                container,
                new vscode.Location(
                    vscode.Uri.file(path.join(scope.uri.fsPath, file)),
                    new vscode.Position(line, 0)
                )
            )
        );
    }
}

module.exports = { CtagsDocumentSymbolProvider };
