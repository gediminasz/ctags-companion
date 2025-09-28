const vscode = require('vscode');
const { getConfiguration, tryExec } = require("./helpers");

const { EXTENSION_NAME } = require("./constants");

function rebuildCtags(exec = tryExec) {
    const scope = getCurrentWorkspaceScope();
    if (scope === undefined) {
        return;
    }

    const command = getConfiguration(scope).get("command");
    const cwd = scope.uri.fsPath;

    exec(command, { cwd });
}

function getCurrentWorkspaceScope() {
    if (vscode.window.activeTextEditor !== undefined) {
        return vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
    }

    if (vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length === 1) {
        return vscode.workspace.workspaceFolders[0];
    }

    vscode.window.showErrorMessage(
        `${EXTENSION_NAME}: Unable to determine active directory in a multi-root workspace. Please open some file and try agan.`
    );
}

module.exports = { rebuildCtags };
