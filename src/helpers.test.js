const vscode = require("vscode");

const { definitionToSymbolInformation } = require("./helpers");


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
