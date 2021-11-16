const vscode = require("vscode");

const { CtagsWorkspaceSymbolProvider } = require("./ctags_workspace_symbol_provider");

const symbolIndex = [
    ["empty", []],
    ["fizz", ['fizz	fizz.py	/^fizz = "fizz"$/;"	kind:variable	line:100']],
    ["multi", [
        'multi	multi1.py	/^multi = "multi"$/;"	kind:variable	line:200',
        'multi	multi2.py	/^multi = "multi"$/;"	kind:variable	line:300',
    ]],
    ["KONSTANT", ['KONSTANT	konstant.py	/^KONSTANT = "KONSTANT"$/;"	kind:variable	line:100']],
    ["Klass", ['Klass	klass.py	/^class Klass:$/;"	kind:class	line:200']],
    ["symbol_with_underscores", [
        'symbol_with_underscores	underscores.py	/^symbol_with_underscores = "?"$/;"	kind:variable	line:100'
    ]],
];

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
                    kind: vscode.SymbolKind.Variable,
                    containerName: undefined,
                    location: {
                        uri: "/test/fizz.py",
                        rangeOrPosition: {
                            line: 99,
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
                    kind: vscode.SymbolKind.Variable,
                    containerName: undefined,
                    location: { uri: "/test/multi1.py", rangeOrPosition: { line: 199, character: 0 } }
                },
                {
                    name: "multi",
                    kind: vscode.SymbolKind.Variable,
                    containerName: undefined,
                    location: { uri: "/test/multi2.py", rangeOrPosition: { line: 299, character: 0 } }
                },
            ]);
        });

        it.each(["K", "k"])("returns symbol informations given multiple matches", async () => {
            const provider = new CtagsWorkspaceSymbolProvider(stash);

            const definitions = await provider.provideWorkspaceSymbols("K");

            expect(definitions).toEqual([
                {
                    name: "KONSTANT",
                    kind: vscode.SymbolKind.Variable,
                    containerName: undefined,
                    location: { uri: "/test/konstant.py", rangeOrPosition: { line: 99, character: 0 } }
                },
                {
                    name: "Klass",
                    kind: vscode.SymbolKind.Class,
                    containerName: undefined,
                    location: { uri: "/test/klass.py", rangeOrPosition: { line: 199, character: 0 } }
                },
            ]);
        });

        it.each(
            ["symbol_with_underscores", "symbolwithunderscores", "swu", "symwithund", "sym_w_us"]
        )("returns symbol informations given symbol with underscores", async (query) => {
            const provider = new CtagsWorkspaceSymbolProvider(stash);

            const definitions = await provider.provideWorkspaceSymbols(query);

            expect(definitions).toEqual([
                {
                    name: "symbol_with_underscores",
                    kind: vscode.SymbolKind.Variable,
                    containerName: undefined,
                    location: {
                        uri: "/test/underscores.py",
                        rangeOrPosition: { line: 99, character: 0 }
                    }
                },
            ]);
        });
    });
});

