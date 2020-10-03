const { determineScope, definitionToSymbolInformation } = require("../helpers");
const { getIndexForScope } = require("../index");

class CtagsDefinitionProvider {
    constructor(stash) {
        this.stash = stash;
    }

    async provideDefinition(document, position) {
        const symbol = document.getText(document.getWordRangeAtPosition(position));
        const scope = determineScope(document);
        const { symbolIndex } = await getIndexForScope(this.stash, scope);

        const definitions = symbolIndex[symbol];
        if (definitions) {
            return definitions.map(definitionToSymbolInformation).map(({ location }) => location);
        }
    }
}

module.exports = { CtagsDefinitionProvider };
