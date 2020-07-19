const fs = require('fs');
const path = require('path');
const readline = require('readline');
const vscode = require('vscode');

const { getConfiguration } = require("./helpers");

async function getIndexForScope(stash, scope) {
    const indexes = stash.context.workspaceState.get("indexes");
    const path = scope.uri.fsPath;
    const isScopeIndexed = indexes && indexes.hasOwnProperty(path);
    if (!isScopeIndexed) await reindexScope(stash, scope);
    return stash.context.workspaceState.get("indexes")[path];
}

async function reindexAll(stash) {
    await Promise.all(vscode.workspace.workspaceFolders.map(scope => reindexScope(stash, scope)));
}

function reindexScope(stash, scope) {
    const tagsPath = path.join(scope.uri.fsPath, getConfiguration(scope).get("path"));

    if (!fs.existsSync(tagsPath)) {
        vscode.window.showErrorMessage(`Ctags Companion: file ${tagsPath} not found`);
        return;
    }

    return new Promise(resolve => {
        const statusBarMessage = vscode.window.setStatusBarMessage(`Ctags Companion: reindexing ${scope.name}...`);

        const input = fs.createReadStream(tagsPath);
        const reader = readline.createInterface({ input, terminal: false, crlfDelay: Infinity });

        const symbolIndex = {};
        const documentIndex = {};

        reader.on("line", (line) => {
            if (line.startsWith("!")) return;

            const [symbol, file, ...rest] = line.split("\t");
            const lineNumberStr = rest.find(value => value.startsWith("line:")).substring(5);
            const lineNumber = parseInt(lineNumberStr, 10) - 1;
            const kind = rest.find(value => value.startsWith("kind:")).substring(5);

            const container = rest.find(value => value.startsWith("class:"));
            const containerName = container && container.substring(6);

            const definition = { symbol, file, line: lineNumber, kind, container: containerName };

            if (!symbolIndex.hasOwnProperty(symbol)) symbolIndex[symbol] = [];
            symbolIndex[symbol].push(definition);

            if (!documentIndex.hasOwnProperty(file)) documentIndex[file] = [];
            documentIndex[file].push(definition);
        });

        reader.on("close", () => {
            const indexes = stash.context.workspaceState.get("indexes") || {};
            indexes[scope.uri.fsPath] = { symbolIndex, documentIndex };
            stash.context.workspaceState.update("indexes", indexes);

            statusBarMessage.dispose();
            resolve();
        });
    });
}

module.exports = { getIndexForScope, reindexAll, reindexScope };
