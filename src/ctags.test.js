const vscode = require('vscode');
const { rebuildCtags } = require("./ctags");

describe(rebuildCtags, () => {
    it.each([undefined, []])("shows error when no workspace folders are open", async (workspaceFolders) => {
        vscode.workspace.workspaceFolders = workspaceFolders;
        const exec = jest.fn();

        await rebuildCtags(exec);

        expect(exec).not.toHaveBeenCalled();
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Ctags Companion: No workspace folders open.');
    });

    it.each([
        undefined,
        { document: { uri: { fsPath: "/test/foo" } } },
        { document: { uri: { fsPath: "/file/outside/workspace" } } },
    ])("always runs ctags when there is a single folder in workspace", async (activeTextEditor) => {
        vscode.window.activeTextEditor = activeTextEditor;
        vscode.workspace.workspaceFolders = [{ uri: { fsPath: "/test" } }];
        const exec = jest.fn();

        await rebuildCtags(exec);

        expect(exec).toHaveBeenCalledTimes(1);
        expect(exec).toHaveBeenLastCalledWith("mock-ctags-command", { cwd: "/test" });
    });

    describe("when there are multiple folders in workspace", () => {
        beforeEach(() => {
            vscode.workspace.workspaceFolders = [
                { name: "backend", uri: { fsPath: "/backend" } },
                { name: "frontend", uri: { fsPath: "/frontend" } },
            ];
        });

        it("shows picker when there is no active text editor", async () => {
            vscode.window.activeTextEditor = undefined;
            const exec = jest.fn();

            await rebuildCtags(exec);

            expect(exec).toHaveBeenCalledTimes(1);
            expect(exec).toHaveBeenLastCalledWith("mock-ctags-command", { cwd: "/backend" });
        });

        it("shows picker when active text editor is outside of workspace", async () => {
            vscode.window.activeTextEditor = { document: { uri: { fsPath: "/file/outside/workspace" } } };
            const exec = jest.fn();

            await rebuildCtags(exec);

            expect(exec).toHaveBeenCalledTimes(1);
            expect(exec).toHaveBeenLastCalledWith("mock-ctags-command", { cwd: "/backend" });
        });

        it("runs ctags on the open file's workspace directory", async () => {
            vscode.window.activeTextEditor = { document: { uri: { fsPath: "/test/foo" } } };
            const exec = jest.fn();

            await rebuildCtags(exec);

            expect(exec).toHaveBeenCalledTimes(1);
            expect(exec).toHaveBeenLastCalledWith("mock-ctags-command", { cwd: "/test" });
        });
    });
});
