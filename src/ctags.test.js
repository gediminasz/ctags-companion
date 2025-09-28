const vscode = require('vscode');
const { rebuildCtags } = require("./ctags");

describe(rebuildCtags, () => {
    it("runs ctags on the open file's workspace directory", () => {
        vscode.window.activeTextEditor = { document: { uri: { fsPath: "/test/foo" } } };

        const exec = jest.fn();
        rebuildCtags(exec);

        expect(exec.mock.calls.length).toBe(1);
        expect(exec.mock.calls[0]).toStrictEqual(["mock-ctags-command", { cwd: "/test" }]);
    });

    it("runs ctags when there is only one workspace directory open", () => {
        vscode.window.activeTextEditor = undefined;

        const exec = jest.fn();
        rebuildCtags(exec);

        expect(exec.mock.calls.length).toBe(1);
        expect(exec.mock.calls[0]).toStrictEqual(["mock-ctags-command", { cwd: "/test" }]);
    });
});
