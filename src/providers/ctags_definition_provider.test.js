const { CtagsDefinitionProvider } = require("./ctags_definition_provider");
const { Extension } = require("../extension");
const { reindexScope } = require("../index");


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

describe(CtagsDefinitionProvider, () => {
    describe("provideDefinition", () => {
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
            const document = makeDocumentWithSymbol("unknownSymbol");
            const provider = new CtagsDefinitionProvider(extension);

            const definitions = await provider.provideDefinition(document, position);

            expect(definitions).toBe(undefined);
        });

        it("returns locations given indexed symbol", async () => {
            const document = makeDocumentWithSymbol("foo");
            const provider = new CtagsDefinitionProvider(extension);

            const definitions = await provider.provideDefinition(document, position);

            expect(definitions).toEqual([
                {
                    uri: "/test/src.py",
                    rangeOrPosition: { line: 31, character: 0 }
                }
            ]);
        });
    });
});

