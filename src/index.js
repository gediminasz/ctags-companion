const fs_ = require('fs');
const path = require('path');
const vscode = require('vscode');

const { getConfiguration, getTagsPath } = require("./helpers");

function getIndexForScope(extension, scope) {
    const path = scope.uri.fsPath;
    return extension.indexes.get(path) || reindexScope(extension, scope);
}


async function reindexAll(extension) {
    vscode.workspace.workspaceFolders.map(scope => reindexScope(extension, scope));
}

function reindexScope(extension, scope, { fs = fs_ } = {}) {
    console.time("[Ctags Companion] reindex");

    const tagsPath = getTagsPath(scope);
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

    const lines = fs.readFileSync(tagsPath, { encoding: "utf-8" }).trim().split("\n");
    const index = createIndex(lines);
    extension.indexes.set(scope.uri.fsPath, index);

    extension.statusBarItem.hide();
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

    return { symbolIndex, documentIndex };
}

module.exports = { getIndexForScope, reindexAll, reindexScope };
