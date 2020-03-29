const fs = require('fs');
const path = require('path');
const readline = require('readline');
const vscode = require('vscode');

const { CtagsDefinitionProvider } = require("./providers/ctags_definition_provider");
const { CtagsDocumentSymbolProvider } = require("./providers/ctags_document_symbol_provider");
const { CtagsWorkspaceSymbolProvider } = require("./providers/ctags_workspace_symbol_provider");

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
            new CtagsDefinitionProvider(context)
        )
    );

    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            documentSelector,
            new CtagsDocumentSymbolProvider(context),
            { label: EXTENSION_NAME }
        )
    );

    context.subscriptions.push(
        vscode.languages.registerWorkspaceSymbolProvider(
            new CtagsWorkspaceSymbolProvider(context)
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

        const symbolIndex = {};
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

            if (!symbolIndex.hasOwnProperty(symbol)) symbolIndex[symbol] = [];
            symbolIndex[symbol].push(definition);

            if (!documentIndex.hasOwnProperty(file)) documentIndex[file] = [];
            documentIndex[file].push(definition);
        });

        reader.on("close", () => {
            const indexes = context.workspaceState.get("indexes") || {};
            indexes[scope.uri.fsPath] = { symbolIndex, documentIndex };
            context.workspaceState.update("indexes", indexes);

            statusBarMessage.dispose();
            resolve();
        });
    });
}

function getConfiguration(scope) {
    return vscode.workspace.getConfiguration(EXTENSION_ID, scope);
}

exports.activate = activate;
module.exports = { activate };
