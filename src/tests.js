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

function assert(condition) {
    console.count("test");
    if (condition()) {
        console.count("pass");
    } else {
        console.count("fail");
        console.error("Assertion failed: ", condition.toString());
    }
}

module.exports = {
    runTests
};
