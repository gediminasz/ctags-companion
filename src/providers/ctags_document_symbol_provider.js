const path = require('path');
const vscode = require("vscode");

const { determineScope, getIndexForScope, toSymbolKind } = require("./helpers");

class CtagsDocumentSymbolProvider {
    constructor(context) {
        this.context = context;
    }

    async provideDocumentSymbols(document) {
        const relativePath = vscode.workspace.asRelativePath(document.uri, false);
        const scope = determineScope(document);
        const { documentIndex } = await getIndexForScope(this.context, scope);

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
