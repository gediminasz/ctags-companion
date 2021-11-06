const fs_ = require('fs');
const path = require('path');
const readline_ = require('readline');
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

function reindexScope(stash, scope, { fs = fs_, readline = readline_ } = {}) {
    const tagsPath = path.join(scope.uri.fsPath, getConfiguration(scope).get("path"));

    if (!fs.existsSync(tagsPath)) {
        stash.statusBarItem.text = (
            `$(warning) Ctags Companion: file ${getConfiguration(scope).get("path")} not found, ` +
            'you may need rerun "rebuild ctags" task'
        );
        stash.statusBarItem.show();
        return;
    }

    return new Promise(resolve => {
        stash.statusBarItem.text = `$(refresh) Ctags Companion: reindexing ${scope.name}...`;
        stash.statusBarItem.show();

        const input = fs.createReadStream(tagsPath);
        const reader = readline.createInterface({ input, terminal: false, crlfDelay: Infinity });

        const symbolIndex = {};
        const documentIndex = {};

        reader.on("line", (line) => {
            if (line.startsWith("!")) return;

            const [symbol, path, ...rest] = line.split("\t");

            if (!symbolIndex.hasOwnProperty(symbol)) symbolIndex[symbol] = [];
            symbolIndex[symbol].push(line);

            if (!documentIndex.hasOwnProperty(path)) documentIndex[path] = [];
            documentIndex[path].push(line);
        });

        reader.on("close", () => {
            const indexes = stash.context.workspaceState.get("indexes") || {};
            indexes[scope.uri.fsPath] = { symbolIndex, documentIndex };
            stash.context.workspaceState.update("indexes", indexes);

            stash.statusBarItem.hide();
            resolve();
        });
    });
}

module.exports = { getIndexForScope, reindexAll, reindexScope };
