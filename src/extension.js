const vscode = require('vscode');
const { exec } = require('child_process');
const { promisify } = require('util');

const { ReadtagsProvider } = require("./readtags");
const { EXTENSION_NAME } = require("./constants");
const { getConfiguration, commandGuard, wrapExec } = require("./helpers");

function activate(context) {
    console.time("[Ctags Companion] activate");

    const documentSelector = getConfiguration().get("documentSelector");

    // Register the rebuild ctags command
    const rebuildCtagsCommand = vscode.commands.registerCommand('ctags-companion.rebuildCtags', async () => {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage('Ctags Companion: No workspace folder found.');
            return;
        }

        // Execute the command for each workspace folder
        const promises = vscode.workspace.workspaceFolders.map(async (workspaceFolder) => {
            const command = getConfiguration(workspaceFolder).get("command");
            if (commandGuard(command)) return;

            const execWrapper = wrapExec(promisify(exec));
            try {
                vscode.window.showInformationMessage(`Rebuilding ctags for ${workspaceFolder.name}...`);
                await execWrapper(command, { cwd: workspaceFolder.uri.fsPath });
                vscode.window.showInformationMessage(`Ctags rebuilt successfully for ${workspaceFolder.name}.`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to rebuild ctags for ${workspaceFolder.name}: ${error.message}`);
            }
        });

        await Promise.all(promises);
    });

    context.subscriptions.push(rebuildCtagsCommand);

    const provider = new ReadtagsProvider(wrapExec(promisify(exec)));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(documentSelector, provider));
    context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(provider));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(documentSelector, provider, { label: EXTENSION_NAME }));

    console.timeEnd("[Ctags Companion] activate");
}

exports.activate = activate;
module.exports = { activate };
