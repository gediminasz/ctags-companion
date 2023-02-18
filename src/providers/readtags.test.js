const vscode = require("vscode");

const { ReadtagsProvider } = require("./readtags");
const { Extension } = require("../extension");

const position = Symbol("position");
const wordRange = Symbol("wordRange");

function makeDocumentWithSymbol(detectedSymbol) {
    return {
        uri: { fsPath: "/test/test.txt" },
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
    const extension = new Extension();
    const document = makeDocumentWithSymbol("bitmap_complement");

    describe("provideDefinition", () => {
        it("returns symbol location", async () => {
            const execute = () => ({ stdout: 'bitmap_complement	include/linux/bitmap.h	/^static inline void bitmap_complement(unsigned long *dst, const unsigned long *src,$/;"	kind:function	line:354	typeref:typename:void' });

            const provider = new ReadtagsProvider(extension, { execute });
            const definitions = await provider.provideDefinition(document, position);

            expect(definitions).toEqual([
                {
                    uri: "/test/include/linux/bitmap.h",
                    rangeOrPosition: { character: 0, line: 353 },
                }
            ]);
        });
    });

    describe("provideWorkspaceSymbols", () => {
        it("returns symbol location", async () => {
            const execute = () => ({ stdout: 'bitmap_complement	include/linux/bitmap.h	/^static inline void bitmap_complement(unsigned long *dst, const unsigned long *src,$/;"	kind:function	line:354	typeref:typename:void' });

            const provider = new ReadtagsProvider(extension, { execute });
            const definitions = await provider.provideWorkspaceSymbols("bitmap_complement");

            expect(definitions).toEqual([
                {
                    name: "bitmap_complement",
                    kind: vscode.SymbolKind.Function,
                    containerName: undefined,
                    location: {
                        uri: "/test/include/linux/bitmap.h",
                        rangeOrPosition: {
                            line: 353,
                            character: 0
                        }
                    }
                }
            ]);
        });

        it.each([undefined, null, ""])("returns nothing when query is falsy", async (query) => {
            const provider = new ReadtagsProvider(extension, { execute: undefined });
            const definitions = await provider.provideWorkspaceSymbols(query);
            expect(definitions).toBe(undefined);
        });

        it.each(["", "\n", " "])("returns an empty list when readtags output is blank", async (stdout) => {
            const execute = () => ({ stdout });

            const provider = new ReadtagsProvider(extension, { execute });
            const definitions = await provider.provideWorkspaceSymbols("foobar");

            expect(definitions).toEqual([]);
        });

        it("returns an empty list when readtags fail", async () => {
            const execute = () => {
                const e = new Error();
                e.stderr = "epic fail";
                throw e;
            };

            const provider = new ReadtagsProvider(extension, { execute });
            const definitions = await provider.provideWorkspaceSymbols("foobar");

            expect(definitions).toEqual([]);
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("Ctags Companion: epic fail");
        });
    });

    describe("provideDocumentSymbols", () => {
        it("returns symbol location", async () => {
            const execute = () => ({ stdout: 'bitmap_complement	include/linux/bitmap.h	/^static inline void bitmap_complement(unsigned long *dst, const unsigned long *src,$/;"	kind:function	line:354	typeref:typename:void' });

            const provider = new ReadtagsProvider(extension, { execute });
            const definitions = await provider.provideDocumentSymbols(document);

            expect(definitions).toEqual([
                {
                    name: "bitmap_complement",
                    kind: vscode.SymbolKind.Function,
                    containerName: undefined,
                    location: {
                        uri: "/test/include/linux/bitmap.h",
                        rangeOrPosition: {
                            line: 353,
                            character: 0
                        }
                    }
                }
            ]);
        });

        it.each(["", "\n", " "])("returns an empty list when readtags output is blank", async (stdout) => {
            const execute = () => ({ stdout });

            const provider = new ReadtagsProvider(extension, { execute });
            const definitions = await provider.provideDocumentSymbols(document);

            expect(definitions).toEqual([]);
        });
    });
});

