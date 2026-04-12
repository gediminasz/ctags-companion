const vscode = require('vscode');
const helpers = require('./helpers');

const { EXTENSION_NAME } = require("./constants");

/**
 * @param {function} tryExec
 */
async function rebuildCtags(tryExec = helpers.tryExec) {
    try {
        const scope = getCurrentWorkspaceScope();
        const command = helpers.getConfiguration(scope).get("command");
        // TODO commandGuard
        await tryExec(command, { cwd: scope.uri.fsPath });
    } catch (e) {
        vscode.window.showErrorMessage(`${EXTENSION_NAME}: ${e.message}`);
    }
}

/**
 * @returns {vscode.WorkspaceFolder}
 */
function getCurrentWorkspaceScope() {
    if (vscode.workspace.workspaceFolders === undefined || vscode.workspace.workspaceFolders.length === 0) {
        throw new Error("No workspace folders open.");
    }

    if (vscode.workspace.workspaceFolders.length === 1) {
        return vscode.workspace.workspaceFolders[0];
    }

    // from here we're dealing with a multi root workspace

    if (vscode.window.activeTextEditor === undefined) {
        throw new Error("Unable to determine current workspace folder with no files open.");
    }

    const workspace = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
    if (workspace === undefined) {
        throw new Error("Current file is outside of your workspace.");
    }
    return workspace;
}

module.exports = { rebuildCtags };
