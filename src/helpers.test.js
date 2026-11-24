const vscode = require("vscode");

const {
    definitionToSymbolInformation,
    definitionToDocumentSymbol,
    buildDocumentSymbolTree,
    commandGuard,
    wrapExec,
} = require("./helpers");

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
            name: "fizz",
            kind: vscode.SymbolKind.Variable,
            containerName: "",
            location: {
                uri: "/path/to/scope/relative/path/to/definition.py",
                rangeOrPosition: { line: 0, character: 0 }
            }
        });
    });
});

describe("definitionToDocumentSymbol", () => {
    it("maps a single-letter kind, sets detail from typeref and records the struct scope", () => {
        const definition = 'tc_magic	src/vos/evt_priv.h	/^    unsigned int tc_magic;$/;"	kind:m	line:77	struct:evt_context	typeref:typename:unsigned int';

        const symbol = definitionToDocumentSymbol(definition);

        expect(symbol.name).toEqual("tc_magic");
        expect(symbol.detail).toEqual("typename:unsigned int");
        expect(symbol.kind).toEqual(vscode.SymbolKind.Property);
        expect(symbol.range).toEqual({ start: { line: 76, character: 0 }, end: { line: 76, character: 0 } });
        expect(symbol.selectionRange).toEqual(symbol.range);
        expect(symbol.children).toEqual([]);
        expect(symbol._container).toEqual("evt_context");
    });

    it("maps ctags long kind names and recognizes every scope prefix", () => {
        const definition = 'evt_context	src/vos/evt_priv.h	/^struct evt_context {$/;"	kind:struct	line:73	union:outer';

        const symbol = definitionToDocumentSymbol(definition);

        expect(symbol.kind).toEqual(vscode.SymbolKind.Struct);
        expect(symbol._container).toEqual("outer");
    });

    it("falls back to Variable for an unknown kind and clamps a missing line to zero", () => {
        const definition = 'fizz	fizz.py	/^fizz = "fizz"$/;"	kind:unknown';

        const symbol = definitionToDocumentSymbol(definition);

        expect(symbol.kind).toEqual(vscode.SymbolKind.Variable);
        expect(symbol.detail).toEqual("");
        expect(symbol.selectionRange.start.line).toEqual(0);
        expect(symbol._container).toEqual("");
    });
});

describe("buildDocumentSymbolTree", () => {
    it("nests members under their parent struct and sorts children by line", () => {
        const definitions = [
            'evt_context	src/vos/evt_priv.h	/^struct evt_context {$/;"	kind:struct	line:73',
            'tc_ref	src/vos/evt_priv.h	/^    int tc_ref;$/;"	m	line:79	struct:evt_context',
            'tc_root	src/vos/evt_priv.h	/^    struct evt_root *tc_root;$/;"	m	line:75	struct:evt_context',
            "",
            "!_TAG_FILE_FORMAT	2	/extended format/",
        ];

        const tree = buildDocumentSymbolTree(definitions);

        expect(tree).toHaveLength(1);
        expect(tree[0].name).toEqual("evt_context");
        expect(tree[0].children.map(s => s.name)).toEqual(["tc_root", "tc_ref"]);
        expect(tree[0].children.map(s => s.selectionRange.start.line)).toEqual([74, 78]);
    });

    it("keeps symbols whose container is missing, self-referential, or duplicated as roots", () => {
        const definitions = [
            'orphan	a.h	/^int orphan;$/;"	m	line:1	struct:missing_parent',
            'self	a.h	/^struct self {$/;"	kind:struct	line:2	struct:self',
            'dup	a.h	/^int dup;$/;"	v	line:3',
            'dup	b.h	/^int dup;$/;"	v	line:4',
        ];

        const tree = buildDocumentSymbolTree(definitions);

        expect(tree.map(s => s.name)).toEqual(["orphan", "self", "dup", "dup"]);
        expect(tree.every(s => s.children.length === 0)).toBe(true);
    });

    it("returns an empty array for no definitions", () => {
        expect(buildDocumentSymbolTree([])).toEqual([]);
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
