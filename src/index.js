const fs_ = require('fs');
const path = require('path');
const readline_ = require('readline');
const vscode = require('vscode');

const { getConfiguration } = require("./helpers");

async function getIndexForScope(extension, scope) {
    const path = scope.uri.fsPath;
    return extension.indexes.get(path) || await reindexScope(extension, scope);
}

async function reindexAll(extension) {
    vscode.workspace.workspaceFolders.map(scope => reindexScope(extension, scope));
}

async function reindexScope(extension, scope, { fs = fs_, readline = readline_ } = {}) {
    console.time("[Ctags Companion] reindex");

    const tagsPath = path.join(scope.uri.fsPath, getConfiguration(scope).get("path"));

    if (!fs.existsSync(tagsPath)) {
        extension.statusBarItem.text = (
            `$(warning) Ctags Companion: file ${getConfiguration(scope).get("path")} not found, ` +
            'you may need rerun "rebuild ctags" task'
        );
        extension.statusBarItem.show();
        return;
    }

    extension.statusBarItem.text = `$(refresh) Ctags Companion: reindexing ${scope.name}...`;
    extension.statusBarItem.show();

    const reader = readline.createInterface({ input: fs.createReadStream(tagsPath) });
    const index = await createIndex(reader);

    extension.indexes.set(scope.uri.fsPath, index);

    extension.statusBarItem.hide();
    console.timeEnd("[Ctags Companion] reindex");
    return index;
}

async function createIndex(reader) {
    const symbolIndex = new Map();
    const documentIndex = new Map();

    for await (const line of reader) {
        if (line.startsWith("!")) continue;

        const [symbol, path] = line.split("\t", 2);

        if (!symbolIndex.has(symbol)) symbolIndex.set(symbol, []);
        symbolIndex.get(symbol).push(line);

        if (!documentIndex.has(path)) documentIndex.set(path, []);
        documentIndex.get(path).push(line);
    }

    return { symbolIndex, documentIndex };
}

module.exports = { getIndexForScope, reindexAll, reindexScope };
