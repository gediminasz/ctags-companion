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

    describe("provideDefinition", () => {
        it("returns symbol location", async () => {
            const document = makeDocumentWithSymbol("bitmap_complement");
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
    });
});

