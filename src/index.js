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
    console.time('reindexScope');
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
        let count = 0;

        reader.on("line", (line) => {
            count++;
            if (line.startsWith("!")) return;

            const [symbol, path, ...rest] = line.split("\t");
            // const file = path.startsWith('/') ? vscode.Uri.parse(path) : vscode.Uri.joinPath(scope.uri, path);
            // const lineNumberStr = rest.find(value => value.startsWith("line:")).substring(5);
            // const lineNumber = parseInt(lineNumberStr, 10) - 1;
            // const kind = rest.find(value => value.startsWith("kind:")).substring(5);

            // const containerTag = rest.find(value => value.startsWith("class:"));
            // const container = containerTag && containerTag.substring(6);

            // const definition = { symbol, file, line: lineNumber, kind, container };

            if (!symbolIndex.hasOwnProperty(symbol)) symbolIndex[symbol] = [];
            symbolIndex[symbol].push(line);

            if (!documentIndex.hasOwnProperty(path)) documentIndex[path] = [];
            documentIndex[path].push(line);
        });

        reader.on("close", () => {
            const indexes = stash.context.workspaceState.get("indexes") || {};
            indexes[scope.uri.fsPath] = { symbolIndex, documentIndex };
            stash.context.workspaceState.update("indexes", indexes);
            console.log({ count });
            console.timeEnd('reindexScope');
            stash.statusBarItem.hide();
            resolve();
        });
    });
}

module.exports = { getIndexForScope, reindexAll, reindexScope };
