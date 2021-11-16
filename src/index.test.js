const { reindexScope } = require("./index");

class MockMemento {
    constructor() {
        this.state = {};
    }
    get(key) {
        return this.state[key];
    }
    update(key, value) {
        this.state[key] = value;
    }
}

class MockStatusBarItem {
    constructor() {
        this.text = null;
        this.visible = false;
    }
    show() {
        this.visible = true;
    }
    hide() {
        this.visible = false;
    }
}

class MockReader {
    constructor() {
        this.handlers = {};
    }
    on(event, handler) {
        this.handlers[event] = handler;
    }
}

describe("reindexScope", () => {
    const scope = { uri: { fsPath: "/test" } };

    it("shows a warning when file does not exist", () => {
        const stash = {
            context: { workspaceState: new MockMemento() },
            statusBarItem: new MockStatusBarItem()
        };
        const fs = {
            existsSync: (path) => {
                expect(path).toEqual("/test/path/to/ctags");
                return false;
            }
        };

        reindexScope(stash, scope, { fs });

        expect(stash.context.workspaceState.state).toEqual({});
        expect(stash.statusBarItem.text).toMatch(/not found/);
        expect(stash.statusBarItem.visible).toBeTruthy();
    });

    describe("when file exists", () => {
        const inputReadStream = Symbol("inputReadStream");
        const fs = {
            existsSync: (path) => {
                expect(path).toEqual("/test/path/to/ctags");
                return true;
            },
            createReadStream: (path) => {
                expect(path).toEqual("/test/path/to/ctags");
                return inputReadStream;
            }
        };
        const makeReadline = (reader) => ({
            createInterface: ({ input }) => {
                expect(input).toBe(inputReadStream);
                return reader;
            }
        });

        it("indicates activity in status bar", () => {
            const stash = {
                context: { workspaceState: new MockMemento() },
                statusBarItem: new MockStatusBarItem()
            };
            const reader = new MockReader();

            reindexScope(stash, scope, { fs, readline: makeReadline(reader) });

            expect(stash.statusBarItem.text).toMatch(/reindexing/);
            expect(stash.statusBarItem.visible).toBeTruthy();

            reader.handlers.close();

            expect(stash.statusBarItem.visible).toBeFalsy();

        });

        it("skips meta lines", () => {
            const stash = {
                context: { workspaceState: new MockMemento() },
                statusBarItem: new MockStatusBarItem()
            };
            const reader = new MockReader();

            reindexScope(stash, scope, { fs, readline: makeReadline(reader) });
            reader.handlers.line("!_THIS_LINE_SHOULD_BE_IGNORED");
            reader.handlers.close();

            expect(stash.context.workspaceState.state).toEqual({
                indexes: {
                    "/test": {
                        symbolIndex: [],
                        documentIndex: []
                    }
                }
            });
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
        ])("indexes tags", (line, expectedSymbol, expectedPath) => {
            const stash = {
                context: { workspaceState: new MockMemento() },
                statusBarItem: new MockStatusBarItem()
            };
            const reader = new MockReader();

            reindexScope(stash, scope, { fs, readline: makeReadline(reader) });
            reader.handlers.line(line);
            reader.handlers.close();

            expect(stash.context.workspaceState.state).toEqual({
                indexes: {
                    "/test": {
                        symbolIndex: [[expectedSymbol, [line]]],
                        documentIndex: [[expectedPath, [line]]],
                    }
                }
            });
        });

        it("appends to already indexed symbols", () => {
            const stash = {
                context: { workspaceState: new MockMemento() },
                statusBarItem: new MockStatusBarItem()
            };
            const reader = new MockReader();
            const firstDefinition = 'Klass	first.py	/^class Klass:$/;"	kind:class	line:1';
            const secondDefinition = 'Klass	second.py	/^class Klass:$/;"	kind:class	line:2';

            reindexScope(stash, scope, { fs, readline: makeReadline(reader) });
            reader.handlers.line(firstDefinition);
            reader.handlers.line(secondDefinition);
            reader.handlers.close();

            expect(stash.context.workspaceState.state).toEqual({
                indexes: {
                    "/test": {
                        symbolIndex: [
                            ["Klass", [firstDefinition, secondDefinition]]
                        ],
                        documentIndex: [
                            ["first.py", [firstDefinition]],
                            ["second.py", [secondDefinition]],
                        ],
                    }
                }
            });
        });

        it("appends to already indexed documents", () => {
            const stash = {
                context: { workspaceState: new MockMemento() },
                statusBarItem: new MockStatusBarItem()
            };
            const reader = new MockReader();
            const fooDefinition = 'Foo	src.py	/^class Foo:$/;"	kind:class	line:1';
            const barDefinition = 'Bar	src.py	/^class Bar:$/;"	kind:class	line:2';

            reindexScope(stash, scope, { fs, readline: makeReadline(reader) });
            reader.handlers.line(fooDefinition);
            reader.handlers.line(barDefinition);
            reader.handlers.close();

            expect(stash.context.workspaceState.state).toEqual({
                indexes: {
                    "/test": {
                        symbolIndex: [
                            ["Foo", [fooDefinition]],
                            ["Bar", [barDefinition]],
                        ],
                        documentIndex: [
                            ["src.py", [fooDefinition, barDefinition]],
                        ]
                    }
                }
            });
        });

        it("does not clash with built-in properties", () => {
            const stash = {
                context: { workspaceState: new MockMemento() },
                statusBarItem: new MockStatusBarItem()
            };
            const reader = new MockReader();
            const clashingDefinition = 'hasOwnProperty	src.py	/^def hasOwnProperty():$/;"	kind:function line:1';
            const fooDefinition = 'Foo	src.py	/^class Foo:$/;"	kind:class	line:10';

            reindexScope(stash, scope, { fs, readline: makeReadline(reader) });
            reader.handlers.line(clashingDefinition);
            reader.handlers.line(fooDefinition);
            reader.handlers.close();

            expect(stash.context.workspaceState.state).toEqual({
                indexes: {
                    "/test": {
                        symbolIndex: [
                            ["hasOwnProperty", [clashingDefinition]],
                            ["Foo", [fooDefinition]],
                        ],
                        documentIndex: [
                            ["src.py", [clashingDefinition, fooDefinition]]
                        ]
                    }
                }
            });
        });
    });
});

