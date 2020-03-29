const path = require('path');
const vscode = require("vscode");

const { toSymbolKind } = require("../helpers");
const { getIndexForScope } = require("../index");

class CtagsWorkspaceSymbolProvider {
    constructor(context) {
        this.context = context;
    }

    async provideWorkspaceSymbols(query) {
        if (!query) return;

        const indexes = await Promise.all(
            vscode.workspace.workspaceFolders.map(
                async scope => [scope, await getIndexForScope(this.context, scope)]
            )
        );

        return indexes.flatMap(([scope, { symbolIndex }]) => {
            return Object.entries(symbolIndex)
                .filter(([symbol]) => symbol.toLowerCase().includes(query.toLowerCase()))
                .flatMap(([_, definitions]) => definitions)
                .map(({ symbol, file, line, kind, container }) =>
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
        });
    }
}

module.exports = { CtagsWorkspaceSymbolProvider };
