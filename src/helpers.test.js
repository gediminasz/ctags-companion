const vscode = require("vscode");

const { definitionToSymbolInformation, commandGuard, wrapExec } = require("./helpers");

describe("definitionToSymbolInformation", () => {
    const scope = { uri: { fsPath: "/path/to/scope" } };

    it("parses symbol information from ctags string", () => {
        const definition = 'fizz	relative/path/to/definition.py	/^    fizz = "fizz"$/;"	kind:variable	line:64	class:Buzz';

        const symbolInformation = definitionToSymbolInformation(definition, scope);

        expect(symbolInformation).toEqual({
            name: "fizz",
            kind: vscode.SymbolKind.Variable,
            containerName: "Buzz",
            location: {
                uri: "/path/to/scope/relative/path/to/definition.py",
                rangeOrPosition: { line: 63, character: 0 }
            }
        });
    });

    it("parses symbol information from ctags string given absolute path", () => {
        const definition = 'fizz	/absolute/path/to/definition.py	/^    fizz = "fizz"$/;"	kind:variable	line:64	class:Buzz';

        const symbolInformation = definitionToSymbolInformation(definition, scope);

        expect(symbolInformation).toEqual({
            name: "fizz",
            kind: vscode.SymbolKind.Variable,
            containerName: "Buzz",
            location: {
                uri: "/absolute/path/to/definition.py",
                rangeOrPosition: { line: 63, character: 0 }
            }
        });
    });

    it.each([
        ["class", vscode.SymbolKind.Class],
        ["func", vscode.SymbolKind.Function],
        ["function", vscode.SymbolKind.Function],
        ["globalVar", vscode.SymbolKind.Variable],
        ["GlobalVar", undefined],
        ["unknown", undefined],
    ])("maps ctags symbol kind to vscode symbol kind", (ctagsKind, vscodeKind) => {
        const definition = `fizz	fizz.py	/^fizz = "fizz"$/;"	kind:${ctagsKind}	line:100`;

        const symbolInformation = definitionToSymbolInformation(definition, scope);

        expect(symbolInformation.kind).toEqual(vscodeKind);
    });

    it("handles missing fields", () => {
        const definition = 'fizz	relative/path/to/definition.py	/^    fizz = "fizz"$/;"';

        const symbolInformation = definitionToSymbolInformation(definition, scope);

        expect(symbolInformation).toEqual({
            name: "fizz",
            kind: undefined,
            containerName: undefined,
            location: {
                uri: "/path/to/scope/relative/path/to/definition.py",
                rangeOrPosition: { line: 0, character: 0 }
            }
        });
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
            e.stderr = "epic fail";
            throw e;
        };

        const result = await wrapExec(exec)();

        expect(result).toEqual([]);
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("Ctags Companion: epic fail");
    });
});
