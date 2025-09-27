const vscode = require('vscode');

const { ReadtagsProvider } = require("./readtags");
const { EXTENSION_NAME, TASK_NAME } = require("./constants");
const { getConfiguration, commandGuard, tryExec, determineScope } = require("./helpers");

function activate(context) {
    console.time("[Ctags Companion] activate");

    const documentSelector = getConfiguration().get("documentSelector");

    if (vscode.workspace.workspaceFolders) {
        vscode.workspace.workspaceFolders.forEach(scope =>
            context.subscriptions.push(
                vscode.tasks.registerTaskProvider("shell", {
                    provideTasks: () => {
                        const command = getConfiguration(scope).get("command");
                        if (commandGuard(command)) return [];
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
    }

    context.subscriptions.push(vscode.commands.registerCommand("ctags-companion.rebuildCtags", () => {
        if (vscode.window.activeTextEditor === undefined) {
            return;
        }

        const scope = determineScope(vscode.window.activeTextEditor.document);
        const command = getConfiguration(scope).get("command");
        const cwd = scope.uri.fsPath;

        tryExec(command, { cwd });
    }));

    const provider = new ReadtagsProvider(tryExec);
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(documentSelector, provider));
    context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(provider));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(documentSelector, provider, { label: EXTENSION_NAME }));

    console.timeEnd("[Ctags Companion] activate");
}

exports.activate = activate;
module.exports = { activate };
