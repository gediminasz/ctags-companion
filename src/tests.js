const path = require('path');
const vscode = require("vscode");

const { CtagsDefinitionProvider } = require("./providers/ctags_definition_provider");
const { CtagsDocumentSymbolProvider } = require("./providers/ctags_document_symbol_provider");
const { CtagsWorkspaceSymbolProvider } = require("./providers/ctags_workspace_symbol_provider");
const { reindexAll } = require("./index");

async function runTests(stash) {
    console.log("Running tests...");

    const document = await vscode.workspace.openTextDocument(
        path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "source.py")
    );

    testCtagsDefinitionProvider(stash, document);
    testCtagsDocumentSymbolProvider(stash, document);
    testCtagsWorkspaceSymbolProvider(stash);
    testReindexAll(stash);
}

async function testCtagsDefinitionProvider(stash, document) {
    const provider = new CtagsDefinitionProvider(stash);

    const [konstantDefinition] = await provider.provideDefinition(document, new vscode.Position(9, 21));
    assert(() => konstantDefinition.uri.path.endsWith("source.py"));
    assert(() => konstantDefinition.range.start.line === 0);

    const [funktionDefinition] = await provider.provideDefinition(document, new vscode.Position(9, 12));
    assert(() => funktionDefinition.uri.path.endsWith("source.py"));
    assert(() => funktionDefinition.range.start.line === 3);

    const [klassDefinition] = await provider.provideDefinition(document, new vscode.Position(15, 3));
    assert(() => klassDefinition.uri.path.endsWith("source.py"));
    assert(() => klassDefinition.range.start.line === 7);

    const [methodDefinition] = await provider.provideDefinition(document, new vscode.Position(15, 8));
    assert(() => methodDefinition.uri.path.endsWith("source.py"));
    assert(() => methodDefinition.range.start.line === 8);

    const [methodWithUnderscoresDefinition] = await provider.provideDefinition(document, new vscode.Position(16, 16));
    assert(() => methodWithUnderscoresDefinition.uri.path.endsWith("source.py"));
    assert(() => methodWithUnderscoresDefinition.range.start.line === 11);

    const printDefinitions = await provider.provideDefinition(document, new vscode.Position(4, 7));
    assert(() => printDefinitions === undefined);
}

async function testCtagsDocumentSymbolProvider(stash, document) {
    const provider = new CtagsDocumentSymbolProvider(stash);

    const definitions = await provider.provideDocumentSymbols(document);

    assert(() => definitions.length == 5);

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

    assert(() => definitions[4].name === "method_with_underscores");
    assert(() => definitions[4].kind === vscode.SymbolKind.Method);
    assert(() => definitions[4].location.uri.path.endsWith("source.py"));
    assert(() => definitions[4].location.range.start.line === 11);
}

async function testCtagsWorkspaceSymbolProvider(stash) {
    const provider = new CtagsWorkspaceSymbolProvider(stash);

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

    const definitionsForMultipleMatches = (await provider.provideWorkspaceSymbols("k")).map(({ name }) => name);
    assert(() => definitionsForMultipleMatches.toString() == "KONSTANT,Klass,funktion");

    const definitionsForMethod = (await provider.provideWorkspaceSymbols("method")).map(({ name }) => name);
    assert(() => definitionsForMethod.toString() == "method,method_with_underscores");

    const definitionsForFuzzyQuery = (await provider.provideWorkspaceSymbols("mwu"));
    assert(() => definitionsForFuzzyQuery.length === 1);
    assert(() => definitionsForFuzzyQuery[0].name === "method_with_underscores");

    const definitionsForUnknownMatch = await provider.provideWorkspaceSymbols("unknown");
    assert(() => definitionsForUnknownMatch.length === 0);
}

async function testReindexAll(stash) {
    stash.context.workspaceState.update("indexes", null);
    assert(() => stash.context.workspaceState.get("indexes") === null);
    await reindexAll(stash);
    assert(() => stash.context.workspaceState.get("indexes") !== null);
}

function assert(condition) {
    if (condition()) {
        console.count("pass");
    } else {
        console.count("fail");
        console.error("FAIL: ", condition.toString());
        vscode.window.showErrorMessage(`FAIL: ${condition.toString()}`);
    }
}

module.exports = {
    runTests
};
