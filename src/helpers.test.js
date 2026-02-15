const vscode = require("vscode");

const { definitionToSymbolInformation, commandGuard, wrapExec, resolveSymbolInformation } = require("./helpers");

describe("definitionToSymbolInformation", () => {
    const scope = { uri: vscode.Uri.parse("/path/to/scope") };

    it("parses symbol information from ctags string", () => {
        const definition = 'fizz	relative/path/to/definition.py	/^    fizz = "fizz"$/;"	kind:variable	line:64	class:Buzz';

        const symbolInformation = definitionToSymbolInformation(definition, scope);

        expect(symbolInformation).toEqual({
            _pattern: `^    fizz = "fizz"$`,
            name: "fizz",
            kind: vscode.SymbolKind.Variable,
            containerName: "Buzz",
            location: {
                uri: vscode.Uri.parse("/path/to/scope/relative/path/to/definition.py"),
                range: {
                    start: { line: 63, character: 0 },
                    end: { line: 63, character: 0 }
                }
            }
        });
    });

    it("parses symbol information from ctags string given absolute path", () => {
        const definition = 'fizz	/absolute/path/to/definition.py	/^    fizz = "fizz"$/;"	kind:variable	line:64	class:Buzz';

        const symbolInformation = definitionToSymbolInformation(definition, scope);

        expect(symbolInformation).toEqual({
            _pattern: `^    fizz = "fizz"$`,
            name: "fizz",
            kind: vscode.SymbolKind.Variable,
            containerName: "Buzz",
            location: {
                uri: vscode.Uri.parse("/absolute/path/to/definition.py"),
                range: {
                    start: { line: 63, character: 0 },
                    end: { line: 63, character: 0 }
                }
            }
        });
    });

    it.each([
        ["class", vscode.SymbolKind.Class],
        ["func", vscode.SymbolKind.Function],
        ["function", vscode.SymbolKind.Function],
        ["globalVar", vscode.SymbolKind.Variable],
        ["GlobalVar", vscode.SymbolKind.Variable],
        ["unknown", vscode.SymbolKind.Variable],
    ])("maps ctags symbol kind to vscode symbol kind", (ctagsKind, vscodeKind) => {
        const definition = `fizz	fizz.py	/^fizz = "fizz"$/;"	kind:${ctagsKind}	line:100`;

        const symbolInformation = definitionToSymbolInformation(definition, scope);

        expect(symbolInformation.kind).toEqual(vscodeKind);
    });

    it("handles missing fields", () => {
        const definition = 'fizz	relative/path/to/definition.py	/^    fizz = "fizz"$/;"';

        const symbolInformation = definitionToSymbolInformation(definition, scope);

        expect(symbolInformation).toEqual({
            _pattern: `^    fizz = "fizz"$`,
            name: "fizz",
            kind: vscode.SymbolKind.Variable,
            containerName: "",
            location: {
                uri: vscode.Uri.parse("/path/to/scope/relative/path/to/definition.py"),
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 }
                }
            }
        });
    });

    it.each([
        [`fizz	/path/to/fizz.py	3`, vscode.SymbolKind.Variable, 3],
        [`fizz	/path/to/fizz.py	3;"	kind:constant`, vscode.SymbolKind.Constant, 3],
        [`fizz	/path/to/fizz.py	3;"	line:55`, vscode.SymbolKind.Variable, 3],
    ])("parses a ctags line with line number", (definition, expectedKind, expectedLine) => {
        const parsed = definitionToSymbolInformation(definition, scope);
        expect(parsed).toEqual({
            containerName: "",
            kind: expectedKind,
            location: {
                range: {
                    end: { character: 0, line: expectedLine },
                    start: { character: 0, line: expectedLine },
                },
                uri: { fsPath: "/path/to/fizz.py" },
            },
            name: "fizz",
        });
    });

    it.each([
        [`fizz	/path/to/fizz.py	/^    fizz = "fizz"$/`, vscode.SymbolKind.Variable, 0],
        [`fizz	/path/to/fizz.py	/^    fizz = "fizz"$/;"	kind:constant`, vscode.SymbolKind.Constant, 0],
        [`fizz	/path/to/fizz.py	/^    fizz = "fizz"$/;"	line:55`, vscode.SymbolKind.Variable, 54],
    ])("parses a ctags line with pattern", (definition, expectedKind, expectedLine) => {
        const parsed = definitionToSymbolInformation(definition, scope);
        expect(parsed).toEqual({
            _pattern: `^    fizz = "fizz"$`,
            containerName: "",
            kind: expectedKind,
            location: {
                range: {
                    end: { character: 0, line: expectedLine },
                    start: { character: 0, line: expectedLine },
                },
                uri: { fsPath: "/path/to/fizz.py" },
            },
            name: "fizz",
        });
    });

    it.each([
        [`fizz	/path/to/fizz.py	3;/^    fizz = "fizz"$/`, vscode.SymbolKind.Variable, 3],
        [`fizz	/path/to/fizz.py	3;/^    fizz = "fizz"$/;"	kind:constant`, vscode.SymbolKind.Constant, 3],
        [`fizz	/path/to/fizz.py	3;/^    fizz = "fizz"$/;"	kind:constant	line:55`, vscode.SymbolKind.Constant, 3],
    ])("parses a ctags line with line number and pattern", (definition, expectedKind, expectedLine) => {
        const parsed = definitionToSymbolInformation(definition, scope);
        expect(parsed).toEqual({
            _pattern: `^    fizz = "fizz"$`,
            containerName: "",
            kind: expectedKind,
            location: {
                range: {
                    end: { character: 0, line: expectedLine },
                    start: { character: 0, line: expectedLine },
                },
                uri: { fsPath: "/path/to/fizz.py" },
            },
            name: "fizz",
        });
    });

    it.each([
        [`fizz	/path/to/fizz.py`, vscode.SymbolKind.Variable],
        [`fizz	/path/to/fizz.py	3	kind:constant`, vscode.SymbolKind.Constant],
    ])("parses a bad ctags line gracefully", (definition, expectedKind) => {
        const parsed = definitionToSymbolInformation(definition, scope);
        expect(parsed).toEqual({
            containerName: "",
            kind: expectedKind,
            location: {
                range: {
                    end: { character: 0, line: 0 },
                    start: { character: 0, line: 0 },
                },
                uri: { fsPath: "/path/to/fizz.py" },
            },
            name: "fizz",
        });
    });
});

describe("resolveSymbolInformation", () => {
    it("searches the file for the pattern", async () => {
        const symbolInformation = {
            _pattern: `^    fizz = "fizz"$`,
            name: "fizz",
            kind: vscode.SymbolKind.Variable,
            containerName: "Buzz",
            location: {
                uri: {
                    fsPath: "/patterns/matching.py"
                },
                range: {
                    start: { line: 63, character: 0 },
                    end: { line: 63, character: 0 }
                }
            }
        };

        const newSymbolInformation = await resolveSymbolInformation(symbolInformation);

        expect(newSymbolInformation).toEqual({
            name: "fizz",
            kind: vscode.SymbolKind.Variable,
            containerName: "Buzz",
            location: {
                uri: {
                    fsPath: "/patterns/matching.py"
                },
                range: {
                    start: { line: 1, character: 0 },
                    end: { line: 1, character: 0 }
                }
            }
        });
    });

    it("searches the file for the symbol name if the pattern has no match", async () => {
        const symbolInformation = {
            _pattern: `^    fizz = "fizz"$`,
            name: "fizz",
            kind: vscode.SymbolKind.Variable,
            containerName: "Buzz",
            location: {
                uri: {
                    fsPath: "/patterns/only_symbol_match.py"
                },
                range: {
                    start: { line: 63, character: 0 },
                    end: { line: 63, character: 0 }
                }
            }
        };

        const newSymbolInformation = await resolveSymbolInformation(symbolInformation);

        expect(newSymbolInformation).toEqual({
            name: "fizz",
            kind: vscode.SymbolKind.Variable,
            containerName: "Buzz",
            location: {
                uri: {
                    fsPath: "/patterns/only_symbol_match.py"
                },
                range: {
                    start: { line: 2, character: 0 },
                    end: { line: 2, character: 0 }
                }
            }
        });
    });

    it("searches the file for the symbol name if the pattern is bad", async () => {
        const symbolInformation = {
            _pattern: "\\",
            name: "fizz",
            kind: vscode.SymbolKind.Variable,
            containerName: "Buzz",
            location: {
                uri: vscode.Uri.parse("/patterns/matching.py"),
                range: {
                    start: { line: 63, character: 0 },
                    end: { line: 63, character: 0 }
                }
            }
        };

        const newSymbolInformation = await resolveSymbolInformation(symbolInformation);

        expect(newSymbolInformation).toEqual({
            name: "fizz",
            kind: vscode.SymbolKind.Variable,
            containerName: "Buzz",
            location: {
                uri: vscode.Uri.parse("/patterns/matching.py"),
                range: {
                    start: { line: 1, character: 4 },
                    end: { line: 1, character: 4 }
                }
            }
        });
    });

    it("searches open documents first to provide locations for dirty files", async () => {
        const symbolInformation = {
            _pattern: `^foo`,
            name: "foo",
            kind: vscode.SymbolKind.Variable,
            containerName: null,
            location: {
                uri: vscode.Uri.parse("/test/dirty_file.py"),
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 }
                }
            }
        };

        const newSymbolInformation = await resolveSymbolInformation(symbolInformation);

        expect(newSymbolInformation).toEqual({
            name: "foo",
            kind: vscode.SymbolKind.Variable,
            containerName: null,
            location: {
                uri: vscode.Uri.parse("/test/dirty_file.py"),
                range: {
                    start: { line: 2, character: 0 },
                    end: { line: 2, character: 0 }
                }
            }
        });
    });

    it("leaves symbol information as is if the file is not readable", async () => {
        const symbolInformation = {
            _pattern: `^    fizz = "fizz"$`,
            name: "fizz",
            kind: vscode.SymbolKind.Variable,
            containerName: "Buzz",
            location: {
                uri: {
                    fsPath: "/patterns/nonexistent.py"
                },
                range: {
                    start: { line: 63, character: 0 },
                    end: { line: 63, character: 0 }
                }
            }
        };

        const newSymbolInformation = await resolveSymbolInformation(symbolInformation);

        expect(newSymbolInformation).toEqual(symbolInformation);
    });

    it("leaves symbol information as is if neither pattern nor name is found", async () => {
        const symbolInformation = {
            _pattern: `^    wrong_name = "wrong_name"$`,
            name: "wrong_name",
            kind: vscode.SymbolKind.Variable,
            containerName: "Buzz",
            location: {
                uri: vscode.Uri.parse("/patterns/matching.py"),
                range: {
                    start: { line: 63, character: 0 },
                    end: { line: 63, character: 0 }
                }
            }
        };

        const newSymbolInformation = await resolveSymbolInformation(symbolInformation);

        expect(newSymbolInformation).toEqual(symbolInformation);
    });
});

describe('commandGuard', () => {
    it('silent when command is present', () => {
        expect(commandGuard("/bin/ctags")).toEqual(false);
        expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
    });

    it.each([undefined, '', '  '])("params that cause error message", param => {
        expect(commandGuard(param)).toEqual(true);
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
            'Ctags Companion: The "Command" preference is not set. Please check your configuration.'
        );
    });
});

describe('wrapExec', () => {
    it('returns an array of stdout lines', async () => {
        const exec = async () => ({ stdout: "\naaa\nbbb\nccc\n" });
        const result = await wrapExec(exec)();
        expect(result).toEqual(["aaa", "bbb", "ccc"]);
    });

    it.each(["", " ", "\n"])('returns an empty array when stdout is blank', async (stdout) => {
        const exec = async () => ({ stdout });
        const result = await wrapExec(exec)();
        expect(result).toEqual([]);
    });

    it('returns an empty array when exec fails', async () => {
        const exec = async () => {
            const e = new Error();
            e.message = "epic fail";
            throw e;
        };

        const result = await wrapExec(exec)();
        expect(result).toEqual([]);

        const outputChannel = vscode.window.createOutputChannel();
        expect(outputChannel.appendLine).toHaveBeenLastCalledWith("epic fail");
    });

    it.each([
        ["win32", "powershell.exe"],
        ["darwin", undefined],
        ["linux", undefined]
    ])('uses powershell in windows', async (platform, expectedShell) => {
        let shellUsed = undefined;

        const exec = async (_, { shell }) => {
            shellUsed = shell;
            return { stdout: "OK" };
        };

        await wrapExec(exec, platform)("fakecommand", {});
        expect(shellUsed).toEqual(expectedShell);
    });
});
