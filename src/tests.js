const path = require('path');
const vscode = require("vscode");

const { CtagsDefinitionProvider } = require("./providers/ctags_definition_provider");
const { CtagsDocumentSymbolProvider } = require("./providers/ctags_document_symbol_provider");
const { CtagsWorkspaceSymbolProvider } = require("./providers/ctags_workspace_symbol_provider");
const { reindexAll } = require("./index");

async function runTests(context) {
    console.log("Running tests...");

    const document = await vscode.workspace.openTextDocument(
        path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "source.py")
    );

    testCtagsDefinitionProvider(context, document);
    testCtagsDocumentSymbolProvider(context, document);
    testCtagsWorkspaceSymbolProvider(context);
    testReindexAll(context);
}

async function testCtagsDefinitionProvider(context, document) {
    const provider = new CtagsDefinitionProvider(context);

    const [konstantDefinition] = await provider.provideDefinition(document, new vscode.Position(9, 21));
    assert(() => konstantDefinition.uri.path.endsWith("source.py"));
    assert(() => konstantDefinition.range.start.line === 0);

    const [funktionDefinition] = await provider.provideDefinition(document, new vscode.Position(9, 12));
    assert(() => funktionDefinition.uri.path.endsWith("source.py"));
    assert(() => funktionDefinition.range.start.line === 3);

    const [klassDefinition] = await provider.provideDefinition(document, new vscode.Position(12, 3));
    assert(() => klassDefinition.uri.path.endsWith("source.py"));
    assert(() => klassDefinition.range.start.line === 7);

    const [methodDefinition] = await provider.provideDefinition(document, new vscode.Position(12, 8));
    assert(() => methodDefinition.uri.path.endsWith("source.py"));
    assert(() => methodDefinition.range.start.line === 8);

    const printDefinitions = await provider.provideDefinition(document, new vscode.Position(4, 7));
    assert(() => printDefinitions === undefined);
}

async function testCtagsDocumentSymbolProvider(context, document) {
    const provider = new CtagsDocumentSymbolProvider(context);

    const definitions = await provider.provideDocumentSymbols(document);

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

async function testCtagsWorkspaceSymbolProvider(context) {
    const provider = new CtagsWorkspaceSymbolProvider(context);

    const definitionsForBlankQuery = await provider.provideWorkspaceSymbols("");
    assert(() => definitionsForBlankQuery === undefined);

    const definitionsForExactMatch = await provider.provideWorkspaceSymbols("Klass");
    assert(() => definitionsForExactMatch.length === 1);
    assert(() => definitionsForExactMatch[0].name === "Klass");
    assert(() => definitionsForExactMatch[0].kind === vscode.SymbolKind.Class);
    assert(() => definitionsForExactMatch[0].location.uri.path.endsWith("source.py"));
    assert(() => definitionsForExactMatch[0].location.range.start.line === 7);

    const definitionsForPartialMatch = await provider.provideWorkspaceSymbols("kla");
    assert(() => definitionsForPartialMatch.length === 1);
    assert(() => definitionsForPartialMatch[0].name === "Klass");
    assert(() => definitionsForPartialMatch[0].kind === vscode.SymbolKind.Class);
    assert(() => definitionsForPartialMatch[0].location.uri.path.endsWith("source.py"));
    assert(() => definitionsForPartialMatch[0].location.range.start.line === 7);

    const definitionsForMultipleMatches = await provider.provideWorkspaceSymbols("k");
    assert(() => definitionsForMultipleMatches.every(({ name }) => ["KONSTANT", "Klass", "funktion"].includes(name)));

    const definitionsForUnknownMatch = await provider.provideWorkspaceSymbols("unknown");
    assert(() => definitionsForUnknownMatch.length === 0);
}

async function testReindexAll(context) {
    context.workspaceState.update("indexes", null);
    assert(() => context.workspaceState.get("indexes") === null);
    await reindexAll(context);
    assert(() => context.workspaceState.get("indexes") !== null);
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
