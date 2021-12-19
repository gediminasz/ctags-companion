const vscode = require('vscode');

const { CtagsDefinitionProvider } = require("./providers/ctags_definition_provider");
const { CtagsDocumentSymbolProvider } = require("./providers/ctags_document_symbol_provider");
const { CtagsWorkspaceSymbolProvider } = require("./providers/ctags_workspace_symbol_provider");
const { EXTENSION_ID, EXTENSION_NAME } = require("./constants");
const { getConfiguration, commandGuard, makeTask } = require("./helpers");
const { reindexAll, reindexScope } = require("./index");
const { parseDocument } = require("./ctags");

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
                        const task = makeTask(scope, "rebuild ctags", command);
                        return [task];
                    },
                    // A valid default implementation for the resolveTask method is to return undefined.
                    resolveTask: () => undefined
                })
            ));
    }

    if (getConfiguration().get("reindexOnSaveEnabled")) {
        vscode.workspace.onDidSaveTextDocument(parseDocument);
    }

    vscode.tasks.onDidEndTask(event => {
        const { source, _, scope } = event.execution.task;
        if (source == EXTENSION_NAME) reindexScope(extension, scope);
    });
}

exports.activate = activate;
module.exports = { activate, Extension };
