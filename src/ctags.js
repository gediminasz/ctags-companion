const vscode = require('vscode');
const helpers = require('./helpers');

const { EXTENSION_NAME } = require("./constants");

/**
 * @param {function} tryExec
 */
function rebuildCtags(tryExec = helpers.tryExec) {
    const scope = getCurrentWorkspaceScope();
    if (scope === undefined) {
        return;
    }

    const command = helpers.getConfiguration(scope).get("command");
    const cwd = scope.uri.fsPath;

    tryExec(command, { cwd });
}

/**
 * @returns {vscode.WorkspaceFolder | undefined}
 */
function getCurrentWorkspaceScope() {
    if (vscode.window.activeTextEditor !== undefined) {
        // TODO do not return undefined here
        return vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
    }

    if (vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length === 1) {
        return vscode.workspace.workspaceFolders[0];
    }

    vscode.window.showErrorMessage(
        `${EXTENSION_NAME}: Unable to determine active directory in a multi-root workspace. Please open some file and try again.`
    );
}

module.exports = { rebuildCtags };
