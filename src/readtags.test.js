const vscode = require("vscode");

const { ReadtagsProvider } = require("./readtags");

const position = Symbol("position");
const wordRange = Symbol("wordRange");

function makeDocumentWithSymbol(detectedSymbol) {
    return {
        uri: vscode.Uri.parse("/test/test.txt"),
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

describe(ReadtagsProvider, () => {
    const document = makeDocumentWithSymbol("bitmap_complement");
    const exec = () => [
        'bitmap_complement	include/linux/bitmap.h	/^static inline void bitmap_complement(unsigned long *dst, const unsigned long *src,$/;"	kind:function	line:354	typeref:typename:void'
    ];

    describe("provideDefinition", () => {
        it("returns symbol location", async () => {
            const provider = new ReadtagsProvider(exec);
            const definitions = await provider.provideDefinition(document, position);

            expect(definitions).toEqual([
                {
                    uri: vscode.Uri.parse("/test/include/linux/bitmap.h"),
                    range: {
                        start: { character: 0, line: 353 },
                        end: { character: 0, line: 353 }
                    },
                }
            ]);
        });

        it("returns an empty list when readtags output is blank", async () => {
            const provider = new ReadtagsProvider(() => []);
            const definitions = await provider.provideDefinition(document, position);
            expect(definitions).toEqual([]);
        });

        it("returns an empty list when document is outside workspace", async () => {
            const document = makeDocumentWithSymbol("bitmap_complement");
            document.uri.fsPath = "/tmp/test.txt";
            const provider = new ReadtagsProvider(undefined);
            const definitions = await provider.provideDefinition(document, position);
            expect(definitions).toEqual([]);
        });
    });

    describe("provideWorkspaceSymbols", () => {
        it("returns symbol location", async () => {
            const provider = new ReadtagsProvider(exec);
            const definitions = await provider.provideWorkspaceSymbols("bitmap_complement");

            expect(definitions).toEqual([
                {
                    name: "bitmap_complement",
                    kind: vscode.SymbolKind.Function,
                    containerName: "",
                    location: {
                        uri: vscode.Uri.parse("/test/include/linux/bitmap.h"),
                        range: {
                            start: { line: 353, character: 0 },
                            end: { line: 353, character: 0 }
                        }
                    },
                    pattern: "^static inline void bitmap_complement(unsigned long *dst, const unsigned long *src,$",
                }
            ]);
        });

        it.each([undefined, null, ""])("returns an empty list when query is falsy", async (query) => {
            const provider = new ReadtagsProvider(undefined);
            const definitions = await provider.provideWorkspaceSymbols(query);
            expect(definitions).toEqual([]);
        });

        it("returns an empty list when readtags output is blank", async () => {
            const provider = new ReadtagsProvider(() => []);
            const definitions = await provider.provideWorkspaceSymbols("foobar");
            expect(definitions).toEqual([]);
        });

        it("returns an empty list when no workspace is open", async () => {
            jest.replaceProperty(vscode.workspace, 'workspaceFolders', undefined);
            const provider = new ReadtagsProvider(undefined);
            const definitions = await provider.provideWorkspaceSymbols("foobar");
            expect(definitions).toEqual([]);
        });
    });

    describe("provideDocumentSymbols", () => {
        it.each([
            ["document within workspace", document],
            ["document outside workspace", { uri: vscode.Uri.parse("/tmp/test.txt") }],
        ])("returns symbol location for %s", async (_, document) => {
            const provider = new ReadtagsProvider(exec);
            const definitions = await provider.provideDocumentSymbols(document);

            expect(definitions).toEqual([
                {
                    name: "bitmap_complement",
                    kind: vscode.SymbolKind.Function,
                    containerName: "",
                    location: {
                        uri: vscode.Uri.parse("include/linux/bitmap.h"),
                        range: {
                            start: { line: 353, character: 0 },
                            end: { line: 353, character: 0 }
                        }
                    },
                    pattern: "^static inline void bitmap_complement(unsigned long *dst, const unsigned long *src,$",
                }
            ]);
        });

        it("returns an empty list when readtags output is blank", async () => {
            const provider = new ReadtagsProvider(() => []);
            const definitions = await provider.provideDocumentSymbols(document);
            expect(definitions).toEqual([]);
        });
    });
});

