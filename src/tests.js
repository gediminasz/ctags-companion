const path = require('path');
const vscode = require("vscode");

const { CtagsDefinitionProvider } = require("./providers/ctags_definition_provider");
const { CtagsDocumentSymbolProvider } = require("./providers/ctags_document_symbol_provider");

async function runTests(context) {
    console.log("Running tests...");
    const document = await vscode.workspace.openTextDocument(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "source.py"));

    testCtagsDefinitionProvider(context, document);
    testCtagsDocumentSymbolProvider(context, document);
}

async function testCtagsDefinitionProvider(context, document) {
    const provider = new CtagsDefinitionProvider(context);

    // KONSTANT
    const [konstantDefinition] = await provider.provideDefinition(document, new vscode.Position(9, 21));
    assert(() => konstantDefinition.uri.path.endsWith("source.py"));
    assert(() => konstantDefinition.range.start.line === 0);

    // funktion
    const [funktionDefinition] = await provider.provideDefinition(document, new vscode.Position(9, 12));
    assert(() => funktionDefinition.uri.path.endsWith("source.py"));
    assert(() => funktionDefinition.range.start.line === 3);

    // Klass
    const [klassDefinition] = await provider.provideDefinition(document, new vscode.Position(12, 3));
    assert(() => klassDefinition.uri.path.endsWith("source.py"));
    assert(() => klassDefinition.range.start.line === 7);

    // method
    const [methodDefinition] = await provider.provideDefinition(document, new vscode.Position(12, 8));
    assert(() => methodDefinition.uri.path.endsWith("source.py"));
    assert(() => methodDefinition.range.start.line === 8);
}

async function testCtagsDocumentSymbolProvider(context, document) {
    const provider = new CtagsDocumentSymbolProvider(context);

    const definitions = await provider.provideDocumentSymbols(document);

    console.log({ definitions });

    assert(() => definitions.length == 4);

    assert(() => definitions[0].name === "KONSTANT");
    assert(() => definitions[0].kind === vscode.SymbolKind.Variable);
    assert(() => definitions[0].location.uri.path.endsWith("source.py"));
    assert(() => definitions[0].location.range.start.line === 0);

    assert(() => definitions[1].name === "Klass");
    assert(() => definitions[1].kind === vscode.SymbolKind.Class);
    assert(() => definitions[1].location.uri.path.endsWith("source.py"));
    assert(() => definitions[1].location.range.start.line === 7);

    assert(() => definitions[2].name === "funktion");
    assert(() => definitions[2].kind === vscode.SymbolKind.Function);
    assert(() => definitions[2].location.uri.path.endsWith("source.py"));
    assert(() => definitions[2].location.range.start.line === 3);

    assert(() => definitions[3].name === "method");
    assert(() => definitions[3].kind === vscode.SymbolKind.Method);
    assert(() => definitions[3].location.uri.path.endsWith("source.py"));
    assert(() => definitions[3].location.range.start.line === 8);
}



function assert(condition) {
    if (condition()) {
        console.count("pass");
    } else {
        console.count("fail");
        console.error("FAIL: ", condition.toString());
    }
}

module.exports = {
    runTests
};
