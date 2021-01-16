const vscode = require("vscode");

const { definitionToSymbolInformation, commandGuard } = require("./helpers");

describe("definitionToSymbolInformation", () => {
    it.each([
        ["class", vscode.SymbolKind.Class],
        ["func", vscode.SymbolKind.Function],
        ["function", vscode.SymbolKind.Function],
        ["globalVar", vscode.SymbolKind.Variable],
        ["GlobalVar", undefined],
        ["unknown", undefined],
    ])("maps ctags symbol kind to vscode symbol kind", (ctagsKind, vscodeKind) => {
        const definition = {
            symbol: "whatever",
            file: "whatever",
            line: 0,
            kind: ctagsKind,
            container: "whatever"
        };

        const symbolInformation = definitionToSymbolInformation(definition);

        expect(symbolInformation.kind).toEqual(vscodeKind);
    });
});

describe('commandGuard', () => {
    it('silent when command is present', () => {
        expect(commandGuard("/bin/ctags")).toEqual(false);
        expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
    })

    it.each([undefined, '', '  '])("params that cause error message", param => {
        expect(commandGuard(param)).toEqual(true);
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
            'Ctags Companion: The "Command" preference is not set. Please check your configuration.'
        );
    })
})
