const vscode = require("vscode");

const { CtagsWorkspaceSymbolProvider } = require("./ctags_workspace_symbol_provider");

const symbolIndex = {
    empty: [],
    fizz: [{
        symbol: "fizz",
        file: "fizz-file",
        line: "fizz-line",
        kind: "function",
        container: "fizz-container"
    }],
    multi: [
        {
            symbol: "multi",
            file: "multi-file-1",
            line: "multi-line-1",
            kind: "function",
            container: "multi-container-1"
        },
        {
            symbol: "multi",
            file: "multi-file-2",
            line: "multi-line-2",
            kind: "function",
            container: "multi-container-2"
        }
    ],
    KONSTANT: [{
        symbol: "KONSTANT",
        file: "KONSTANT-file",
        line: "KONSTANT-line",
        kind: "function",
        container: "KONSTANT-container"
    }],
    Klass: [{
        symbol: "Klass",
        file: "Klass-file",
        line: "Klass-line",
        kind: "function",
        container: "Klass-container"
    }],
    symbol_with_underscores: [{
        symbol: "symbol_with_underscores",
        file: "symbol_with_underscores-file",
        line: "symbol_with_underscores-line",
        kind: "function",
        container: "symbol_with_underscores-container"
    }],
};

describe(CtagsWorkspaceSymbolProvider, () => {
    describe("provideWorkspaceSymbols", () => {
        const stash = {
            context: {
                workspaceState: {
                    get: (key) => {
                        switch (key) {
                            case "indexes":
                                return {
                                    "/test": { symbolIndex }
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

        it.each(
            ["fizz", "Fizz", "FIZZ", "f", "fi", "fiz", "zz"]
        )("returns symbol informations given a matching query", async (query) => {
            const provider = new CtagsWorkspaceSymbolProvider(stash);

            const definitions = await provider.provideWorkspaceSymbols(query);

            expect(definitions).toEqual([
                {
                    name: "fizz",
                    kind: vscode.SymbolKind.Function,
                    containerName: "fizz-container",
                    location: {
                        uri: "fizz-file",
                        rangeOrPosition: {
                            line: "fizz-line",
                            character: 0
                        }
                    }
                }
            ]);
        });

        it("returns symbol informations given multiple definitions", async () => {
            const provider = new CtagsWorkspaceSymbolProvider(stash);

            const definitions = await provider.provideWorkspaceSymbols("multi");

            expect(definitions).toEqual([
                {
                    name: "multi",
                    kind: vscode.SymbolKind.Function,
                    containerName: "multi-container-1",
                    location: { uri: "multi-file-1", rangeOrPosition: { line: "multi-line-1", character: 0 } }
                },
                {
                    name: "multi",
                    kind: vscode.SymbolKind.Function,
                    containerName: "multi-container-2",
                    location: { uri: "multi-file-2", rangeOrPosition: { line: "multi-line-2", character: 0 } }
                },
            ]);
        });

        it.each(["K", "k"])("returns symbol informations given multiple matches", async () => {
            const provider = new CtagsWorkspaceSymbolProvider(stash);

            const definitions = await provider.provideWorkspaceSymbols("K");

            expect(definitions).toEqual([
                {
                    name: "KONSTANT",
                    kind: vscode.SymbolKind.Function,
                    containerName: "KONSTANT-container",
                    location: { uri: "KONSTANT-file", rangeOrPosition: { line: "KONSTANT-line", character: 0 } }
                },
                {
                    name: "Klass",
                    kind: vscode.SymbolKind.Function,
                    containerName: "Klass-container",
                    location: { uri: "Klass-file", rangeOrPosition: { line: "Klass-line", character: 0 } }
                },
            ]);
        });

        it.each(
            ["symbol_with_underscores", "symbolwithunderscores", "swu", "symwithund"]
        )("returns symbol informations given symbol with underscores", async (query) => {
            const provider = new CtagsWorkspaceSymbolProvider(stash);

            const definitions = await provider.provideWorkspaceSymbols(query);

            expect(definitions).toEqual([
                {
                    name: "symbol_with_underscores",
                    kind: vscode.SymbolKind.Function,
                    containerName: "symbol_with_underscores-container",
                    location: {
                        uri: "symbol_with_underscores-file",
                        rangeOrPosition: { line: "symbol_with_underscores-line", character: 0 }
                    }
                },
            ]);
        });
    });
});

