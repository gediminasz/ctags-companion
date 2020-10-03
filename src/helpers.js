const vscode = require("vscode");

const { EXTENSION_ID } = require("./constants");

function determineScope(document) {
    return vscode.workspace.workspaceFolders.find(scope => document.uri.fsPath.includes(scope.uri.fsPath));
}

function getConfiguration(scope) {
    return vscode.workspace.getConfiguration(EXTENSION_ID, scope);
}

function definitionToSymbolInformation({ symbol, file, line, kind, container }) {
    return new vscode.SymbolInformation(
        symbol,
        toSymbolKind(kind),
        container,
        new vscode.Location(file, new vscode.Position(line, 0))
    );
}

function toSymbolKind(kind) {
    switch (kind) {
        case "class": return vscode.SymbolKind.Class;
        case "function": return vscode.SymbolKind.Function;
        case "member": return vscode.SymbolKind.Method;
        case "variable": return vscode.SymbolKind.Variable;
    }
}

module.exports = { determineScope, getConfiguration, definitionToSymbolInformation };
