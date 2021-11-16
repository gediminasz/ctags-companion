const vscode = require("vscode");

const { CtagsDocumentSymbolProvider } = require("./ctags_document_symbol_provider");

function makeDocumentWithPath(fsPath) {
    return { uri: { fsPath }, };
}

describe(CtagsDocumentSymbolProvider, () => {
    describe("provideDocumentSymbols", () => {
        const stash = {
            context: { workspaceState: new vscode.Memento() }
        };
        stash.context.workspaceState.update("indexes", {
            "/test": {
                documentIndex: [
                    ["empty", []],
                    ["foo", ['foo	src.py	/^    def foo(self):$/;"	kind:member	line:32	class:Goo']],
                ]
            }
        });

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
                    kind: vscode.SymbolKind.Property,
                    containerName: "Goo",
                    location: {
                        uri: "/test/src.py",
                        rangeOrPosition: { line: 31, character: 0 }
                    }
                }
            ]);
        });
    });
});

