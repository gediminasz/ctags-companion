const vscode = require('vscode');
const fs = require('fs');
const readline = require('readline');

// TODO
// [2020-02-22 17:34:57.024] [exthost] [warning] [Deprecation Warning] 'workspace.rootPath' is deprecated. Please use 'workspace.workspaceFolders' instead. More details: https://aka.ms/vscode-eliminating-rootpath
// DocumentSymbolProvider
// ctags on save
// enable for languages
// maintain multiple tag files: one for .venv (slow, ctagged once) and one for project (fast, ctagged on every file save), and merge them into a single index
// SymbolInformation kind and containerName

function activate(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('ctags-companion.reindex', () => reindex(context))
    );

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            { scheme: "file" },
            {
                provideDefinition: async (document, position) => {
                    const symbol = document.getText(document.getWordRangeAtPosition(position));
                    const index = await getIndex(context);
                    const results = index[symbol];

                    if (!results) return;

                    return results.map(({ file, line }) =>
                        new vscode.Location(
                            vscode.Uri.file(vscode.workspace.rootPath + "/" + file),
                            new vscode.Position(line, 0)
                        )
                    );
                }
            }
        )
    );

    context.subscriptions.push(
        vscode.languages.registerWorkspaceSymbolProvider(
            {
                provideWorkspaceSymbols: async (query) => {
                    if (!query) return;

                    const index = await getIndex(context);
                    return Object.entries(index)
                        .filter(([symbol]) => symbol.toLowerCase().includes(query.toLowerCase()))
                        .flatMap(([_, definitions]) => definitions)
                        .map(({ symbol, file, line }) =>
                            new vscode.SymbolInformation(
                                symbol,
                                null,
                                null,
                                new vscode.Location(
                                    vscode.Uri.file(vscode.workspace.rootPath + "/" + file),
                                    new vscode.Position(line, 0)
                                )
                            )
                        );
                }
            }
        )
    );

    context.subscriptions.push(
        vscode.tasks.registerTaskProvider("shell", {
            provideTasks: () => {
                const task = new vscode.Task(
                    { type: "shell" },
                    vscode.TaskScope.Workspace,
                    "ctags",
                    "Ctags Companion",
                    new vscode.ShellExecution("ctags -R --python-kinds=-i --fields=+n -f .tags"),
                    []
                );
                task.presentationOptions.reveal = false;
                return [task];
            },
            resolveTask: (task) => task
        })
    );
}

async function getIndex(context) {
    const index = context.workspaceState.get("index");
    if (!index) await reindex(context);
    return context.workspaceState.get("index");
}

function reindex(context) {
    return new Promise(resolve => {
        const input = fs.createReadStream(vscode.workspace.rootPath + "/.tags");
        const reader = readline.createInterface({ input, terminal: false, crlfDelay: Infinity });
        const index = {};

        reader.on("line", (line) => {
            if (line.startsWith("!")) return;

            const [symbol, file, ...rest] = line.split("\t");
            const lineNumberStr = rest.find(value => value.startsWith("line:")).substring(5);
            const lineNumber = parseInt(lineNumberStr, 10) - 1;

            if (!index.hasOwnProperty(symbol)) index[symbol] = [];
            index[symbol].push({ symbol, file, line: lineNumber });
        });

        reader.on("close", () => {
            vscode.window.showInformationMessage("Ctags Companion: reindex complete!");
            context.workspaceState.update("index", index);
            resolve();
        });
    });
}

exports.activate = activate;

module.exports = {
    activate
};
