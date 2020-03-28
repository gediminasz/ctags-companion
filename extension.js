const fs = require('fs');
const path = require('path');
const readline = require('readline');
const vscode = require('vscode');

const EXTENSION_NAME = "Ctags Companion";
const EXTENSION_ID = "ctags-companion";
const TASK_NAME = "rebuild ctags";

function activate(context) {
    const documentSelector = vscode.workspace.getConfiguration(EXTENSION_ID).get("documentSelector");

    context.subscriptions.push(
        vscode.commands.registerCommand(`${EXTENSION_ID}.reindex`, () => reindex(context))
    );

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            documentSelector,
            {
                provideDefinition: async (document, position) => {
                    const symbol = document.getText(document.getWordRangeAtPosition(position));

                    const indexes = await getIndexes(context);
                    const scope = determineScope(document);
                    const workspaceIndex = indexes[scope.uri.fsPath].workspaceIndex;

                    const definitions = workspaceIndex[symbol];
                    if (!definitions) return;

                    return definitions.map(({ file, line }) =>
                        new vscode.Location(
                            vscode.Uri.file(path.join(scope.uri.fsPath, file)),
                            new vscode.Position(line, 0)
                        )
                    );
                }
            }
        )
    );

    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            documentSelector,
            {
                provideDocumentSymbols: async (document) => {
                    const relativePath = vscode.workspace.asRelativePath(document.uri, false);

                    const indexes = await getIndexes(context);
                    const scope = determineScope(document);
                    const documentIndex = indexes[scope.uri.fsPath].documentIndex;

                    const definitions = documentIndex[relativePath];
                    if (!definitions) return;

                    return definitions.map(({ symbol, file, line, kind, container }) =>
                        new vscode.SymbolInformation(
                            symbol,
                            toSymbolKind(kind),
                            container,
                            new vscode.Location(
                                vscode.Uri.file(path.join(scope.uri.fsPath, file)),
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

                    const indexes = await getIndexes(context);

                    return Object.entries(indexes).flatMap(([rootPath, { workspaceIndex }]) =>
                        Object.entries(workspaceIndex)
                            .filter(([symbol]) => symbol.toLowerCase().includes(query.toLowerCase()))
                            .flatMap(([_, definitions]) => definitions)
                            .map(({ symbol, file, line, kind, container }) =>
                                new vscode.SymbolInformation(
                                    symbol,
                                    toSymbolKind(kind),
                                    container,
                                    new vscode.Location(
                                        vscode.Uri.file(path.join(rootPath, file)),
                                        new vscode.Position(line, 0)
                                    )
                                )
                            )
                    );
                }
            }
        )
    );

    vscode.workspace.workspaceFolders.forEach(scope =>
        context.subscriptions.push(
            vscode.tasks.registerTaskProvider("shell", {
                provideTasks: () => {
                    const command = getConfiguration(scope).get("command");
                    const task = new vscode.Task(
                        { type: "shell" },
                        scope,
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
        ));

    vscode.tasks.onDidEndTask(event => {
        const { source, name, scope } = event.execution.task;
        if (source == EXTENSION_NAME && name == TASK_NAME) reindexScope(context, scope);
    });
}

// async function getIndex(context) {
//     const index = context.workspaceState.get("index");
//     if (!index) await reindex(context);
//     return context.workspaceState.get("index");
// }

// async function getDocumentIndex(context) {
//     const index = context.workspaceState.get("documentIndex");
//     if (!index) await reindex(context);
//     return context.workspaceState.get("documentIndex");
// }

// function reindex(context) {
//     const relativeTagsPath = vscode.workspace.getConfiguration(EXTENSION_ID).get("path");
//     const tagsPath = path.join(vscode.workspace.rootPath, relativeTagsPath);

//     if (!fs.existsSync(tagsPath)) {
//         vscode.window.showErrorMessage(`Ctags Companion reindex failed: file ${relativeTagsPath} not found`);
//         return;
//     }

//     return new Promise(resolve => {
//         const statusBarMessage = vscode.window.setStatusBarMessage("Ctags Companion: reindexing...");

//         const input = fs.createReadStream(tagsPath);
//         const reader = readline.createInterface({ input, terminal: false, crlfDelay: Infinity });

//         const index = {};
//         const documentIndex = {};

//         reader.on("line", (line) => {
//             if (line.startsWith("!")) return;

//             const [symbol, file, ...rest] = line.split("\t");
//             const lineNumberStr = rest.find(value => value.startsWith("line:")).substring(5);
//             const lineNumber = parseInt(lineNumberStr, 10) - 1;
//             const kind = rest.find(value => value.startsWith("kind:")).substring(5);

//             const container = rest.find(value => value.startsWith("class:"));
//             const containerName = container && container.substring(6);

//             const definition = { symbol, file, line: lineNumber, kind, container: containerName };

//             if (!index.hasOwnProperty(symbol)) index[symbol] = [];
//             index[symbol].push(definition);

//             if (!documentIndex.hasOwnProperty(file)) documentIndex[file] = [];
//             documentIndex[file].push(definition);
//         });

//         reader.on("close", () => {
//             context.workspaceState.update("index", index);
//             context.workspaceState.update("documentIndex", documentIndex);

//             statusBarMessage.dispose();
//             resolve();
//         });
//     });
// }

function reindexScope(context, scope) {
    const tagsPath = path.join(scope.uri.fsPath, getConfiguration(scope).get("path"));

    if (!fs.existsSync(tagsPath)) {
        vscode.window.showErrorMessage(`Ctags Companion: file ${tagsPath} not found`);
        return;
    }

    return new Promise(resolve => {
        const statusBarMessage = vscode.window.setStatusBarMessage(`Ctags Companion: reindexing ${scope.name}...`);

        const input = fs.createReadStream(tagsPath);
        const reader = readline.createInterface({ input, terminal: false, crlfDelay: Infinity });

        const workspaceIndex = {};
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

            if (!workspaceIndex.hasOwnProperty(symbol)) workspaceIndex[symbol] = [];
            workspaceIndex[symbol].push(definition);

            if (!documentIndex.hasOwnProperty(file)) documentIndex[file] = [];
            documentIndex[file].push(definition);
        });

        reader.on("close", () => {
            const indexes = getIndexes(context);
            indexes[scope.uri.fsPath] = { workspaceIndex, documentIndex };
            context.workspaceState.update("indexes", indexes);

            console.log("NEW INDEX", getIndexes(context));

            statusBarMessage.dispose();
            resolve();
        });
    });
}

function getIndexes(context) {
    return context.workspaceState.get("indexes") || initIndexes();
}

function initIndexes() {
    return vscode.workspace.workspaceFolders.reduce(
        (indexes, scope) => ({
            ...indexes,
            [scope.uri.fsPath]: {
                workspaceIndex: {},
                documentIndex: {}
            }
        }),
        {}
    );
}

function toSymbolKind(kind) {
    switch (kind) {
        case "class": return vscode.SymbolKind.Class;
        case "function": return vscode.SymbolKind.Function;
        case "member": return vscode.SymbolKind.Method;
        case "variable": return vscode.SymbolKind.Variable;
    }
}

function getConfiguration(scope) {
    return vscode.workspace.getConfiguration(EXTENSION_ID, scope);
}

function determineScope(document) {
    return vscode.workspace.workspaceFolders.find(scope => document.uri.fsPath.includes(scope.uri.fsPath));
}

exports.activate = activate;
module.exports = { activate };
