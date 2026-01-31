const vscode = require('vscode');
const helpers = require('./helpers');

const { EXTENSION_NAME } = require("./constants");

/**
 * @param {function} tryExec
 */
function rebuildCtags(tryExec = helpers.tryExec) {
    try {
        const scope = getCurrentWorkspaceScope();
        const command = helpers.getConfiguration(scope).get("command");
        const cwd = scope.uri.fsPath;
        tryExec(command, { cwd });
    } catch (error) {
        vscode.window.showErrorMessage(`${EXTENSION_NAME}: ${error}`);
    }
}

/**
 * | folders in workspace | active file       | result |
 * |----------------------|------------------ |--------|
 * | 0                    | (any)             | error  |
 * | 1                    | (any)             | OK     |
 * | N                    | undefined         | error  |
 * | N                    | outside workspace | error  |
 * | N                    | within workspace  | OK     |
 *
 * @returns {vscode.WorkspaceFolder}
 */
function getCurrentWorkspaceScope() {
    if (vscode.workspace.workspaceFolders === undefined || vscode.workspace.workspaceFolders.length === 0) {
        throw "No workspace folders open.";
    } else if (vscode.workspace.workspaceFolders.length === 1) {
        return vscode.workspace.workspaceFolders[0];
    } else {
        if (vscode.window.activeTextEditor === undefined) {
            // TODO maybe showQuickPick from workspaceFolders
            throw "Unable to determine active directory in a multi-root workspace. Please open some file and try again.";
        }
        const workspace = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
        if (workspace === undefined) {
            // TODO maybe showQuickPick from workspaceFolders
            throw "Unable to determine active workspace directory for the currently open file.";
        }
        return workspace;
    }
}

module.exports = { rebuildCtags };
