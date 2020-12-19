const { CtagsDocumentSymbolProvider } = require("./ctags_document_symbol_provider");

function makeDocumentWithUri(uri) {
    return { uri };
}

describe(CtagsDocumentSymbolProvider, () => {
    describe("provideDocumentSymbols", () => {
        const stash = {
            context: {
                workspaceState: {
                    get: (key) => {
                        switch (key) {
                            case "indexes":
                                return {
                                    "/test": {
                                        documentIndex: {
                                            emptyListDocument: [],
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
            const document = makeDocumentWithUri("unknown-uri");
            const provider = new CtagsDocumentSymbolProvider(stash);

            const definitions = await provider.provideDocumentSymbols(document);

            expect(definitions).toBe(undefined);
        });

        it("handles empty list", async () => {
            const document = makeDocumentWithUri("emptyListDocument");
            const provider = new CtagsDocumentSymbolProvider(stash);

            const definitions = await provider.provideDocumentSymbols(document);

            expect(definitions).toEqual([]);
        });

        it("returns symbol informations given indexed document", async () => {
            const document = makeDocumentWithUri("foo");
            const provider = new CtagsDocumentSymbolProvider(stash);

            const definitions = await provider.provideDocumentSymbols(document);

            expect(definitions).toEqual([
                {
                    name: "foo",
                    kind: undefined,  // TODO
                    containerName: "foo-container",
                    location: {
                        uri: "foo-file",
                        rangeOrPosition: {
                            line: "foo-line",
                            character: 0
                        }
                    }
                }
            ]);
        });
    });
});

