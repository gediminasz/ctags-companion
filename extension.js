const vscode = require('vscode');
const fs = require('fs');
const readline = require('readline');

// [2020-02-22 17:34:57.024] [exthost] [warning] [Deprecation Warning] 'workspace.rootPath' is deprecated. Please use 'workspace.workspaceFolders' instead. More details: https://aka.ms/vscode-eliminating-rootpath

function activate(context) {
    let disposable = vscode.commands.registerCommand('ctags-companion.reindex', function () {
        vscode.window.showInformationMessage("Ctags Companion: reindexing...");
        reindex();
    });

    context.subscriptions.push(disposable);
}

function reindex() {
    const input = fs.createReadStream(vscode.workspace.rootPath + "/.tags");
    const reader = readline.createInterface({ input, terminal: false, crlfDelay: Infinity })

    const index = {};

    reader.on("line", (line) => {
        if (line.startsWith("!"))
            return;

        const [name, file, code] = line.split("\t");
        if (!index.hasOwnProperty(name))
            index[name] = [];
        index[name].push({ file, code });
    });

    reader.on("close", () => {
        vscode.window.showInformationMessage("Ctags Companion: reindex complete!");
        console.log(`Index size: ${Object.keys(index).length}`);
    });
}

exports.activate = activate;

module.exports = {
    activate
}
