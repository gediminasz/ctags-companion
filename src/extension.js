const vscode = require('vscode');

const { CtagsDefinitionProvider } = require("./providers/ctags_definition_provider");
const { CtagsDocumentSymbolProvider } = require("./providers/ctags_document_symbol_provider");
const { CtagsWorkspaceSymbolProvider } = require("./providers/ctags_workspace_symbol_provider");
const { EXTENSION_ID, EXTENSION_NAME, TASK_NAME } = require("./constants");
const { getConfiguration } = require("./helpers");
const { reindexAll, reindexScope } = require("./index");
const { runTests } = require("./tests");

class Stash {
    constructor(context) {
        this.context = context;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    }
}

function activate(context) {
    const stash = new Stash(context);

    if (process.env.CTAGS_COMPANION_TEST) runTests(stash);

    const documentSelector = vscode.workspace.getConfiguration(EXTENSION_ID).get("documentSelector");

    context.subscriptions.push(stash.statusBarItem);

    context.subscriptions.push(vscode.commands.registerCommand(`${EXTENSION_ID}.reindex`, () => reindexAll(stash)));

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            documentSelector,
            new CtagsDefinitionProvider(stash)
        )
    );

    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            documentSelector,
            new CtagsDocumentSymbolProvider(stash),
            { label: EXTENSION_NAME }
        )
    );

    context.subscriptions.push(
        vscode.languages.registerWorkspaceSymbolProvider(
            new CtagsWorkspaceSymbolProvider(stash)
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
        if (source == EXTENSION_NAME && name == TASK_NAME) reindexScope(stash, scope);
    });
}

exports.activate = activate;
module.exports = { activate };
