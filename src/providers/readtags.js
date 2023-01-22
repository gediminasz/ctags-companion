const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const { determineScope, getConfiguration } = require("../helpers");

// Definitions provider based on readtags command line utility
// https://docs.ctags.io/en/latest/man/readtags.1.html
class ReadtagsProvider {
    constructor(extension) {
        this.extension = extension;
    }

    async provideDefinition(document, position) {
        const symbol = document.getText(document.getWordRangeAtPosition(position));
        const scope = determineScope(document);

        const command = getConfiguration(scope).get("readtagsCommand");
        const cwd = scope.uri.fsPath;
        const { stdout } = await promisify(exec)(`${command} ${symbol}`, { cwd });

        console.log(stdout);
    }
}

module.exports = { ReadtagsProvider };
