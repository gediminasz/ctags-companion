const path = require('path');
const vscode = require("vscode");

const { determineScope, getIndexForScope } = require("./helpers");

class CtagsDefinitionProvider {
    constructor(context) {
        this.context = context;
    }

    async provideDefinition(document, position) {
        const symbol = document.getText(document.getWordRangeAtPosition(position));
        const scope = determineScope(document);
        const { symbolIndex } = await getIndexForScope(this.context, scope);

        const definitions = symbolIndex[symbol];
        if (!definitions) return;

        return definitions.map(({ file, line }) =>
            new vscode.Location(
                vscode.Uri.file(path.join(scope.uri.fsPath, file)),
                new vscode.Position(line, 0)
            )
        );
    }
}

module.exports = { CtagsDefinitionProvider };
