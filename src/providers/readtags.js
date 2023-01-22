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

        // TODO GZL readtagsCommand setting and cwd to scope root
        const tagsPath = path.join(scope.uri.fsPath, getConfiguration(scope).get("path"));
        const { stdout } = await promisify(exec)(`readtags -t ${tagsPath} ${symbol}`);
        console.log(stdout);
    }
}

module.exports = { ReadtagsProvider };
