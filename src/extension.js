const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const { CtagsDefinitionProvider } = require("./providers/ctags_definition_provider");
const { CtagsDocumentSymbolProvider } = require("./providers/ctags_document_symbol_provider");
const { CtagsWorkspaceSymbolProvider } = require("./providers/ctags_workspace_symbol_provider");
const { EXTENSION_ID, EXTENSION_NAME, TASK_NAME } = require("./constants");
const { determineScope, getConfiguration, commandGuard } = require("./helpers");
const { reindexAll, reindexScope } = require("./index");

class Extension {
    constructor(context) {
        this.context = context;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.indexes = new Map();
    }
}

function activate(context) {
    const extension = new Extension(context);

    const documentSelector = getConfiguration().get("documentSelector");

    context.subscriptions.push(extension.statusBarItem);

    context.subscriptions.push(vscode.commands.registerCommand(`${EXTENSION_ID}.reindex`, () => reindexAll(extension)));

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            documentSelector,
            new CtagsDefinitionProvider(extension)
        )
    );

    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            documentSelector,
            new CtagsDocumentSymbolProvider(extension),
            { label: EXTENSION_NAME }
        )
    );

    context.subscriptions.push(
        vscode.languages.registerWorkspaceSymbolProvider(
            new CtagsWorkspaceSymbolProvider(extension)
        )
    );

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
                            [],  // do not prompt the user about problem matchers
                        );
                        task.presentationOptions.reveal = false;
                        return [task];
                    },
                    // A valid default implementation for the resolveTask method is to return undefined.
                    resolveTask: () => undefined
                })
            ));
    }

    vscode.workspace.onDidSaveTextDocument(document => {
        if (getConfiguration().get("reindexOnSaveEnabled")) {
            const scope = determineScope(document);
            const scopeConfiguration = getConfiguration(scope);
            const documentSelector = scopeConfiguration.get("documentSelector");

            if (vscode.languages.match(documentSelector, document) == 0) return;

            // remove existing tags mentioning current file:
            const tagsPath = path.join(scope.uri.fsPath, getConfiguration(scope).get("path"));
            const documentRelativePath = vscode.workspace.asRelativePath(document.uri, false);
            if (fs.existsSync(tagsPath)) {
                const lines = fs.readFileSync(tagsPath, { encoding: "utf-8" }).split("\n");
                const linesToKeep = lines.filter(line => !line.includes(documentRelativePath));
                fs.writeFileSync(tagsPath, linesToKeep.join("\n"));
            }

            // execute ctags in append mode:
            const command = scopeConfiguration.get("command");
            const task = new vscode.Task(
                { type: "shell" },
                scope,
                "append ctags",
                EXTENSION_NAME,
                new vscode.ShellExecution(`${command} --append \${file}`),
                [],
            );
            task.presentationOptions.reveal = false;
            vscode.tasks.executeTask(task);
        }
    });

    vscode.tasks.onDidEndTask(event => {
        const { source, name, scope } = event.execution.task;
        if (source == EXTENSION_NAME) reindexScope(extension, scope);
    });
}

exports.activate = activate;
module.exports = { activate, Extension };
