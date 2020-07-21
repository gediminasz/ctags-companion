const path = require('path');
const vscode = require("vscode");

const { determineScope } = require("../helpers");
const { getIndexForScope } = require("../index");

class CtagsDefinitionProvider {
    constructor(stash) {
        this.stash = stash;
    }

    async provideDefinition(document, position) {
        const symbol = document.getText(document.getWordRangeAtPosition(position));
        const scope = determineScope(document);
        const { symbolIndex } = await getIndexForScope(this.stash, scope);

        const definitions = symbolIndex[symbol];
        if (!definitions) return;

        return definitions.map(({ file, line }) =>
            new vscode.Location(
                vscode.Uri.joinPath(scope.uri, file),
                new vscode.Position(line, 0)
            )
        );
    }
}

module.exports = { CtagsDefinitionProvider };
