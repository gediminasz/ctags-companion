const vscode = require("vscode");

function determineScope(document) {
    return vscode.workspace.workspaceFolders.find(scope => document.uri.fsPath.includes(scope.uri.fsPath));
}

async function getIndexForScope(context, scope) {
    const indexes = context.workspaceState.get("indexes");
    const path = scope.uri.fsPath;
    const isScopeIndexed = indexes && indexes.hasOwnProperty(path);
    if (!isScopeIndexed) await reindexScope(context, scope);
    return context.workspaceState.get("indexes")[path];
}

module.exports = { determineScope, getIndexForScope };
