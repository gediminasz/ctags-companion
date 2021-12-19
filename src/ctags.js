const fs = require('fs');
const vscode = require('vscode');

const { EXTENSION_NAME } = require("./constants");
const { determineScope, getConfiguration, commandGuard, getTagsPath } = require("./helpers");

function parseDocument(document) {
    const scope = determineScope(document);

    const documentSelector = getConfiguration(scope).get("documentSelector");
    if (vscode.languages.match(documentSelector, document) == 0) return;

    const documentRelativePath = vscode.workspace.asRelativePath(document.uri, false);
    removeExistingTags(scope, documentRelativePath);
    appendTags(scope, documentRelativePath);
}

function removeExistingTags(scope, documentRelativePath) {
    const tagsPath = getTagsPath(scope);
    if (!fs.existsSync(tagsPath)) return;

    const lines = fs.readFileSync(tagsPath, { encoding: "utf-8" })
        .split("\n")
        .filter(line => !line.includes(documentRelativePath));

    fs.writeFileSync(tagsPath, lines.join("\n"));
}

function appendTags(scope, documentRelativePath) {
    const command = getConfiguration(scope).get("command");
    if (commandGuard(command)) return;
    const task = new vscode.Task(
        { type: "shell" },
        scope,
        "append ctags",
        EXTENSION_NAME,
        new vscode.ShellExecution(`${command} --append ${documentRelativePath}`),
        [],
    );
    task.presentationOptions.reveal = false;
    vscode.tasks.executeTask(task);
}

module.exports = { parseDocument };
