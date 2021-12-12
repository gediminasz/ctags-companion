const fs_ = require('fs');
const path = require('path');
const vscode = require('vscode');

const { getConfiguration } = require("./helpers");

async function getIndexForScope(stash, scope) {
    const path = scope.uri.fsPath;
    return stash.indexes.get(path) || await reindexScope(stash, scope);
}


async function reindexAll(stash) {
    vscode.workspace.workspaceFolders.map(scope => reindexScope(stash, scope));
}

function reindexScope(stash, scope, { fs = fs_ } = {}) {
    console.time("[Ctags Companion] reindex");

    const tagsPath = path.join(scope.uri.fsPath, getConfiguration(scope).get("path"));

    if (!fs.existsSync(tagsPath)) {
        stash.statusBarItem.text = (
            `$(warning) Ctags Companion: file ${getConfiguration(scope).get("path")} not found, ` +
            'you may need rerun "rebuild ctags" task'
        );
        stash.statusBarItem.show();
        return;
    }

    stash.statusBarItem.text = `$(refresh) Ctags Companion: reindexing ${scope.name}...`;
    stash.statusBarItem.show();

    const lines = fs.readFileSync(tagsPath, { encoding: "utf-8" }).trim().split("\n");
    const index = createIndex(lines);
    stash.indexes.set(scope.uri.fsPath, index);

    stash.statusBarItem.hide();
    console.timeEnd("[Ctags Companion] reindex");
    return index;
}

function createIndex(lines) {
    const symbolIndex = new Map();
    const documentIndex = new Map();

    lines.forEach(line => {
        if (line.startsWith("!")) return;

        const [symbol, path] = line.split("\t", 2);

        if (!symbolIndex.has(symbol)) symbolIndex.set(symbol, []);
        symbolIndex.get(symbol).push(line);

        if (!documentIndex.has(path)) documentIndex.set(path, []);
        documentIndex.get(path).push(line);
    });

    return { symbolIndex: [...symbolIndex], documentIndex: [...documentIndex] };
}

module.exports = { getIndexForScope, reindexAll, reindexScope };
