const { Extension } = require("./extension");
const { reindexScope } = require("./index");

describe("reindexScope", () => {
    const scope = { uri: { fsPath: "/test" } };
    const readStream = Symbol("readStream");

    it("shows a warning when file does not exist", () => {
        const extension = new Extension();
        const fs = {
            existsSync: (path) => {
                expect(path).toEqual("/test/path/to/ctags");
                return false;
            },
            createReadStream: () => readStream,
        };
        const readline = {
            createInterface: () => {
                fail('should not be called');
            },
        };

        reindexScope(extension, scope, { fs, readline });

        expect(extension.indexes).toEqual(new Map());
        expect(extension.statusBarItem.text).toMatch(/not found/);
        expect(extension.statusBarItem.visible).toBeTruthy();
    });

    describe("when file exists", () => {
        const fs = {
            existsSync: (path) => {
                expect(path).toEqual("/test/path/to/ctags");
                return true;
            },
            createReadStream: () => readStream,
        };
        const readline = {
            createInterface: () => [],
        };

        it("indicates activity in status bar", async () => {
            const extension = new Extension();

            await reindexScope(extension, scope, { fs, readline });

            expect(extension.statusBarItem.text).toMatch(/reindexing/);
            expect(extension.statusBarItem.visible).toBeFalsy();
            expect(extension.statusBarItem._wasShown).toBeTruthy();
        });

        it("skips meta lines", async () => {
            const extension = new Extension();

            line = "!_THIS_LINE_SHOULD_BE_IGNORED";
            await reindexScope(extension, scope, { fs, readline: { createInterface: () => [line] } });

            expect(extension.indexes).toEqual(new Map([["/test", { symbolIndex: new Map(), documentIndex: new Map() }]]));
        });

        it.each([
            [
                'KONSTANT	test_projects/python/source.py	/^KONSTANT = "KONSTANT"$/;"	kind:variable	line:1',
                "KONSTANT",
                "test_projects/python/source.py",
            ],
            [
                'method	test_projects/python/source.py	/^    def method(self):$/;"	kind:member	line:9	class:Klass',
                "method",
                "test_projects/python/source.py",
            ],
            [
                'ExternalLib	/usr/lib/pyhon/external_lib.py	/^class ExternalLib:$/;"	kind:class	line:22',
                "ExternalLib",
                "/usr/lib/pyhon/external_lib.py",
            ],
        ])("indexes tags", async (line, expectedSymbol, expectedPath) => {
            const extension = new Extension();

            await reindexScope(extension, scope, { fs, readline: { createInterface: () => [line] } });

            expect(extension.indexes).toEqual(new Map([
                [
                    "/test",
                    {
                        symbolIndex: new Map([[expectedSymbol, [line]]]),
                        documentIndex: new Map([[expectedPath, [line]]]),
                    }
                ]
            ]));
        });

        it("appends to already indexed symbols", async () => {
            const extension = new Extension();

            const firstDefinition = 'Klass	first.py	/^class Klass:$/;"	kind:class	line:1';
            const secondDefinition = 'Klass	second.py	/^class Klass:$/;"	kind:class	line:2';

            await reindexScope(extension, scope, { fs, readline: { createInterface: () => [firstDefinition, secondDefinition] } });

            expect(extension.indexes).toEqual(new Map([
                [
                    "/test",
                    {
                        symbolIndex: new Map([["Klass", [firstDefinition, secondDefinition]]]),
                        documentIndex: new Map([["first.py", [firstDefinition]], ["second.py", [secondDefinition]]]),
                    }
                ]
            ]));
        });

        it("appends to already indexed documents", async () => {
            const extension = new Extension();

            const fooDefinition = 'Foo	src.py	/^class Foo:$/;"	kind:class	line:1';
            const barDefinition = 'Bar	src.py	/^class Bar:$/;"	kind:class	line:2';

            await reindexScope(extension, scope, { fs, readline: { createInterface: () => [fooDefinition, barDefinition] } });

            expect(extension.indexes).toEqual(new Map([
                [
                    "/test",
                    {
                        symbolIndex: new Map([["Foo", [fooDefinition]], ["Bar", [barDefinition]]]),
                        documentIndex: new Map([["src.py", [fooDefinition, barDefinition]]])
                    }
                ]
            ]));
        });

        it("does not clash with built-in properties", async () => {
            const extension = new Extension();

            const clashingDefinition = 'hasOwnProperty	src.py	/^def hasOwnProperty():$/;"	kind:function line:1';
            const fooDefinition = 'Foo	src.py	/^class Foo:$/;"	kind:class	line:10';

            await reindexScope(extension, scope, { fs, readline: { createInterface: () => [clashingDefinition, fooDefinition] } });

            expect(extension.indexes).toEqual(new Map([
                [
                    "/test",
                    {
                        symbolIndex: new Map([["hasOwnProperty", [clashingDefinition]], ["Foo", [fooDefinition]]]),
                        documentIndex: new Map([["src.py", [clashingDefinition, fooDefinition]]])
                    }
                ]
            ]));
        });
    });
});

