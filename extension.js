const vscode = require('vscode');
const fs = require('fs');
const readline = require('readline');

// [2020-02-22 17:34:57.024] [exthost] [warning] [Deprecation Warning] 'workspace.rootPath' is deprecated. Please use 'workspace.workspaceFolders' instead. More details: https://aka.ms/vscode-eliminating-rootpath

function activate(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('ctags-companion.reindex', function () {
            vscode.window.showInformationMessage("Ctags Companion: reindexing...");
            reindex(context);
        })
    );

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            { scheme: "file" },
            {
                provideDefinition: (document, position) => {
                    const symbol = document.getText(document.getWordRangeAtPosition(position));
                    const index = context.workspaceState.get("index");  // TODO handle index undefined
                    const results = index[symbol];
                    console.log({ document, position, symbol, results });
                    if (results) {
                        return results.map(({ file, line }) =>
                            new vscode.Location(
                                vscode.Uri.file(vscode.workspace.rootPath + "/" + file),
                                new vscode.Position(line, 0)
                            )
                        )
                    }
                }
            }
        )
    );
}

function reindex(context) {
    const input = fs.createReadStream(vscode.workspace.rootPath + "/.tags");
    const reader = readline.createInterface({ input, terminal: false, crlfDelay: Infinity })

    const index = {};

    reader.on("line", (line) => {
        if (line.startsWith("!"))
            return;

        const [name, file, ...rest] = line.split("\t");
        const lineNumber = rest.find(value => value.startsWith("line:")).substring(5);

        if (!index.hasOwnProperty(name))
            index[name] = [];
        index[name].push({ file, line: parseInt(lineNumber, 10) - 1 });
    });

    reader.on("close", () => {
        vscode.window.showInformationMessage("Ctags Companion: reindex complete!");
        console.log(`Index size: ${Object.keys(index).length}`);
        context.workspaceState.update("index", index);
    });
}

exports.activate = activate;

module.exports = {
    activate
}
