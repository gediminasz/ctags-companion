const vscode = require("vscode");

const { ReadtagsProvider } = require("./readtags");

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
                    uri: "/test/include/linux/bitmap.h",
                    rangeOrPosition: { character: 0, line: 353 },
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
                        uri: "/test/include/linux/bitmap.h",
                        rangeOrPosition: {
                            line: 353,
                            character: 0
                        }
                    }
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
            ["document outside workspace", { uri: { fsPath: "/tmp/test.txt" } }],
        ])("returns a DocumentSymbol tree for %s", async (_, document) => {
            const provider = new ReadtagsProvider(exec);
            const definitions = await provider.provideDocumentSymbols(document);

            expect(definitions).toEqual([
                {
                    name: "bitmap_complement",
                    kind: vscode.SymbolKind.Function,
                    detail: "typename:void",
                    range: { start: { line: 353, character: 0 }, end: { line: 353, character: 0 } },
                    selectionRange: { start: { line: 353, character: 0 }, end: { line: 353, character: 0 } },
                    children: [],
                }
            ]);
        });

        it("nests struct members below their parent", async () => {
            const execWithStruct = () => [
                'evt_context\tsrc/vos/evt_priv.h\t/^struct evt_context {$/;"\tkind:struct\tline:73',
                'tc_root\tsrc/vos/evt_priv.h\t/^\tstruct evt_root *tc_root;$/;"\tm\tline:75\tstruct:evt_context',
            ];
            const provider = new ReadtagsProvider(execWithStruct);

            const definitions = await provider.provideDocumentSymbols(document);

            expect(definitions).toHaveLength(1);
            expect(definitions[0].name).toEqual("evt_context");
            expect(definitions[0].children.map(s => s.name)).toEqual(["tc_root"]);
        });

        it("returns an empty list when readtags output is blank", async () => {
            const provider = new ReadtagsProvider(() => []);
            const definitions = await provider.provideDocumentSymbols(document);
            expect(definitions).toEqual([]);
        });
    });
});

