const fs = require('fs');
const path = require('path');
const readline = require('readline');
const vscode = require('vscode');

// TODO
// [2020-02-22 17:34:57.024] [exthost] [warning] [Deprecation Warning] 'workspace.rootPath' is deprecated. Please use 'workspace.workspaceFolders' instead. More details: https://aka.ms/vscode-eliminating-rootpath
// ctags on save
// enable for languages
// SymbolInformation containerName
// non-python specific symbol kinds

const EXTENSION_NAME = "Ctags Companion";
const EXTENSION_ID = "ctags-companion";
const TASK_NAME = "rebuild ctags";

function activate(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand(`${EXTENSION_ID}.reindex`, () => reindex(context))
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
        vscode.languages.registerDocumentSymbolProvider(
            { scheme: "file" },
            {
                provideDocumentSymbols: async (document) => {
                    const relativePath = vscode.workspace.asRelativePath(document.uri);
                    const definitions = (await getDocumentIndex(context))[relativePath];
                    if (!definitions) return;
                    return definitions.map(({ symbol, file, line, kind }) =>
                        new vscode.SymbolInformation(
                            symbol,
                            toSymbolKind(kind),
                            null,
                            new vscode.Location(
                                vscode.Uri.file(vscode.workspace.rootPath + "/" + file),
                                new vscode.Position(line, 0)
                            )
                        )
                    );
                }
            },
            { label: EXTENSION_NAME }
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
                        .map(({ symbol, file, line, kind }) =>
                            new vscode.SymbolInformation(
                                symbol,
                                toSymbolKind(kind),
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
                const command = vscode.workspace.getConfiguration(EXTENSION_ID).get("command");
                const task = new vscode.Task(
                    { type: "shell" },
                    vscode.TaskScope.Workspace,
                    TASK_NAME,
                    EXTENSION_NAME,
                    new vscode.ShellExecution(command),
                    []
                );
                task.presentationOptions.reveal = false;
                return [task];
            },
            resolveTask: (task) => task
        })
    );

    vscode.tasks.onDidEndTask(event => {
        const { source, name } = event.execution.task;
        if (source == EXTENSION_NAME && name == TASK_NAME) reindex(context);
    });
}

async function getIndex(context) {
    const index = context.workspaceState.get("index");
    if (!index) await reindex(context);
    return context.workspaceState.get("index");
}

async function getDocumentIndex(context) {
    const index = context.workspaceState.get("documentIndex");
    if (!index) await reindex(context);
    return context.workspaceState.get("documentIndex");
}

function reindex(context) {
    return new Promise(resolve => {
        const statusBarMessage = vscode.window.setStatusBarMessage("Ctags Companion: reindexing...");

        const tagsPath = path.join(
            vscode.workspace.rootPath,
            vscode.workspace.getConfiguration(EXTENSION_ID).get("path")
        );
        const input = fs.createReadStream(tagsPath);
        const reader = readline.createInterface({ input, terminal: false, crlfDelay: Infinity });

        const index = {};
        const documentIndex = {};

        reader.on("line", (line) => {
            if (line.startsWith("!")) return;

            const [symbol, file, ...rest] = line.split("\t");
            const lineNumberStr = rest.find(value => value.startsWith("line:")).substring(5);
            const lineNumber = parseInt(lineNumberStr, 10) - 1;
            const kind = rest.find(value => value.startsWith("kind:")).substring(5);
            const definition = { symbol, file, line: lineNumber, kind };

            if (!index.hasOwnProperty(symbol)) index[symbol] = [];
            index[symbol].push(definition);

            if (!documentIndex.hasOwnProperty(file)) documentIndex[file] = [];
            documentIndex[file].push(definition);
        });

        reader.on("close", () => {
            context.workspaceState.update("index", index);
            context.workspaceState.update("documentIndex", documentIndex);

            statusBarMessage.dispose();
            resolve();
        });
    });
}

function toSymbolKind(kind) {
    switch (kind) {
        case "class": return vscode.SymbolKind.Class;
        case "function": return vscode.SymbolKind.Function;
        case "member": return vscode.SymbolKind.Method;
        case "variable": return vscode.SymbolKind.Variable;
    }
}

exports.activate = activate;

module.exports = {
    activate
};
