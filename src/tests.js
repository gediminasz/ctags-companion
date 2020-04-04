const path = require('path');
const vscode = require("vscode");

const { CtagsDefinitionProvider } = require("./providers/ctags_definition_provider");

async function runTests(context) {
    console.log("Running tests...");
    const document = await vscode.workspace.openTextDocument(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "source.py"));

    testCtagsDefinitionProvider(context, document);
}

async function testCtagsDefinitionProvider(context, document) {
    const provider = new CtagsDefinitionProvider(context);

    // KONSTANT
    const [konstanceDefinition] = await provider.provideDefinition(document, new vscode.Position(9, 21));
    console.assert(konstanceDefinition.uri.path.endsWith("source.py"));
    console.assert(konstanceDefinition.range.start.line === 0);

    // funktion
    const [funktionDefinition] = await provider.provideDefinition(document, new vscode.Position(9, 12));
    console.assert(funktionDefinition.uri.path.endsWith("source.py"));
    console.assert(funktionDefinition.range.start.line === 3);

    // Klass
    const [klassDefinition] = await provider.provideDefinition(document, new vscode.Position(12, 3));
    console.assert(klassDefinition.uri.path.endsWith("source.py"));
    console.assert(klassDefinition.range.start.line === 7);

    // method
    const [methodDefinition] = await provider.provideDefinition(document, new vscode.Position(12, 8));
    console.assert(methodDefinition.uri.path.endsWith("source.py"));
    console.assert(methodDefinition.range.start.line === 8);
}

module.exports = {
    runTests
};
