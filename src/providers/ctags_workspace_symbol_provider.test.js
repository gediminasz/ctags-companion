const { CtagsWorkspaceSymbolProvider } = require("./ctags_workspace_symbol_provider");

function makeDocumentWithUri(uri) {
    return { uri };
}

describe(CtagsWorkspaceSymbolProvider, () => {
    describe("provideWorkspaceSymbols", () => {
        const stash = {
            context: {
                workspaceState: {
                    get: (key) => {
                        switch (key) {
                            case "indexes":
                                return {
                                    "/test": {
                                        symbolIndex: {
                                            empty: [],
                                            foo: [{
                                                symbol: "foo",
                                                file: "foo-file",
                                                line: "foo-line",
                                                kind: "foo-kind",
                                                container: "foo-container"
                                            }]
                                        }
                                    },
                                };
                        }
                    }
                }
            }
        };

        it.each([undefined, null, ""])("returns nothing when query is falsy", async (query) => {
            const provider = new CtagsWorkspaceSymbolProvider(stash);

            const definitions = await provider.provideWorkspaceSymbols(query);

            expect(definitions).toBe(undefined);
        });

        it("returns nothing when no definitions are found", async () => {
            const provider = new CtagsWorkspaceSymbolProvider(stash);

            const definitions = await provider.provideWorkspaceSymbols("unknownSymbol");

            expect(definitions).toEqual([]);
        });

        it("handles empty list", async () => {
            const provider = new CtagsWorkspaceSymbolProvider(stash);

            const definitions = await provider.provideWorkspaceSymbols("empty");

            expect(definitions).toEqual([]);
        });

        it("returns symbol informations given exact query", async () => {
            const provider = new CtagsWorkspaceSymbolProvider(stash);

            const definitions = await provider.provideWorkspaceSymbols("foo");

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

