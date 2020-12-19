const { CtagsDefinitionProvider } = require("./ctags_definition_provider");

const position = Symbol("position");
const wordRange = Symbol("wordRange");

function makeDocumentWithSymbol(detectedSymbol) {
    return {
        getWordRangeAtPosition: (p) => {
            expect(p).toBe(position);
            return wordRange;
        },
        getText: (wr) => {
            expect(wr).toBe(wordRange);
            return detectedSymbol;
        }
    };
}

describe(CtagsDefinitionProvider, () => {
    describe("provideDefinition", () => {
        const stash = {
            context: {
                workspaceState: {
                    get: (key) => {
                        switch (key) {
                            case "indexes":
                                return {
                                    "/test": {
                                        symbolIndex: {
                                            emptyListSymbol: [],
                                            foo: [{
                                                symbol: "foo",
                                                file: "foo-file",
                                                line: "foo-line",
                                                kind: "foo-kind",
                                                container: "foo-container"
                                            }]
                                        }
                                    }
                                };
                        }
                    }
                }
            }
        };

        it("returns nothing when no definitions are found", async () => {
            const document = makeDocumentWithSymbol("unknownSymbol");
            const provider = new CtagsDefinitionProvider(stash);

            const definitions = await provider.provideDefinition(document, position);

            expect(definitions).toBe(undefined);
        });

        it("handles empty list", async () => {
            const document = makeDocumentWithSymbol("emptyListSymbol");
            const provider = new CtagsDefinitionProvider(stash);

            const definitions = await provider.provideDefinition(document, position);

            expect(definitions).toEqual([]);
        });

        it("returns locations given indexed symbol", async () => {
            const document = makeDocumentWithSymbol("foo");
            const provider = new CtagsDefinitionProvider(stash);

            const definitions = await provider.provideDefinition(document, position);

            expect(definitions).toEqual([
                {
                    uri: "foo-file",
                    rangeOrPosition: {
                        line: "foo-line",
                        character: 0
                    }
                }
            ]);
        });
    });
});

