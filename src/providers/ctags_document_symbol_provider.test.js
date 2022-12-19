const vscode = require("vscode");

const { CtagsDocumentSymbolProvider } = require("./ctags_document_symbol_provider");
const { Extension } = require("../extension");
const { reindexScope } = require("../index");

function makeDocumentWithPath(fsPath) {
    return { uri: { fsPath }, };
}

describe(CtagsDocumentSymbolProvider, () => {
    describe("provideDocumentSymbols", () => {
        const extension = new Extension();
        const scope = { uri: { fsPath: "/test" } };
        const readStream = Symbol("readStream");
        const fs = {
            existsSync: () => true,
            createReadStream: () => readStream,
        };
        const readline = {
            createInterface: ({ input }) => {
                expect(input).toBe(readStream);
                return ['foo	src.py	/^    def foo(self):$/;"	kind:member	line:32	class:Goo'];
            },
        };

        reindexScope(extension, scope, { fs, readline });

        it("returns nothing when no definitions are found", async () => {
            const document = makeDocumentWithPath("/test/unknown");
            const provider = new CtagsDocumentSymbolProvider(extension);

            const definitions = await provider.provideDocumentSymbols(document);

            expect(definitions).toBe(undefined);
        });

        it("returns symbol informations given indexed document", async () => {
            const document = makeDocumentWithPath("/test/src.py");
            const provider = new CtagsDocumentSymbolProvider(extension);

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

