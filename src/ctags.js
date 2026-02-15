const vscode = require('vscode');
const helpers = require('./helpers');

const { EXTENSION_NAME } = require("./constants");

class Cancel extends Error { }

/**
 * @param {function} tryExec
 */
async function rebuildCtags(tryExec = helpers.tryExec) {
    try {
        const scope = await getCurrentWorkspaceScope();
        const command = helpers.getConfiguration(scope).get("command");
        // TODO commandGuard
        await tryExec(command, { cwd: scope.uri.fsPath });
    } catch (e) {
        if (e instanceof Cancel) {
            return;
        }
        vscode.window.showErrorMessage(`${EXTENSION_NAME}: ${e}`);
    }
}

/**
 * | folders in workspace | active file       | result |
 * |----------------------|------------------ |--------|
 * | 0                    | (any)             | error  |
 * | 1                    | (any)             | OK     |
 * | N                    | undefined         | pick   |
 * | N                    | outside workspace | pick   |
 * | N                    | within workspace  | OK     |
 *
 * @returns {Promise<vscode.WorkspaceFolder>}
 */
async function getCurrentWorkspaceScope() {
    if (vscode.workspace.workspaceFolders === undefined || vscode.workspace.workspaceFolders.length === 0) {
        throw "No workspace folders open.";
    } else if (vscode.workspace.workspaceFolders.length === 1) {
        return vscode.workspace.workspaceFolders[0];
    } else {
        if (vscode.window.activeTextEditor === undefined) {
            return pickWorkspaceFolder(vscode.workspace.workspaceFolders);
        }
        const workspace = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
        if (workspace === undefined) {  // active file is outside of workspace
            return pickWorkspaceFolder(vscode.workspace.workspaceFolders);
        }
        return workspace;
    }
}

/**
 * @param {readonly vscode.WorkspaceFolder[]} workspaceFolders
 * @returns {Promise<vscode.WorkspaceFolder>}
 */
async function pickWorkspaceFolder(workspaceFolders) {
    const workspaces = new Map(workspaceFolders.map(w => [w.name, w]));
    const choice = await vscode.window.showQuickPick(
        Array.from(workspaces.keys()),
        { placeHolder: "Select a workspace folder" }
    );

    if (choice === undefined) {
        throw new Cancel();
    }

    const workspace = workspaces.get(choice);
    if (workspace === undefined) {
        throw new Cancel();
    }

    return workspace;
}

module.exports = { rebuildCtags };
