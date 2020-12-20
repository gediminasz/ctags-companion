const vscode = require("vscode");

const { CtagsDocumentSymbolProvider } = require("./ctags_document_symbol_provider");

function makeDocumentWithPath(fsPath) {
    return { uri: { fsPath }, };
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
                                            empty: [],
                                            foo: [{
                                                symbol: "foo",
                                                file: "foo-file",
                                                line: "foo-line",
                                                kind: "function",
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
            const document = makeDocumentWithPath("/test/unknown");
            const provider = new CtagsDocumentSymbolProvider(stash);

            const definitions = await provider.provideDocumentSymbols(document);

            expect(definitions).toBe(undefined);
        });

        it("handles empty list", async () => {
            const document = makeDocumentWithPath("/test/empty");
            const provider = new CtagsDocumentSymbolProvider(stash);

            const definitions = await provider.provideDocumentSymbols(document);

            expect(definitions).toEqual([]);
        });

        it("returns symbol informations given indexed document", async () => {
            const document = makeDocumentWithPath("/test/foo");
            const provider = new CtagsDocumentSymbolProvider(stash);

            const definitions = await provider.provideDocumentSymbols(document);

            expect(definitions).toEqual([
                {
                    name: "foo",
                    kind: vscode.SymbolKind.Function,
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

