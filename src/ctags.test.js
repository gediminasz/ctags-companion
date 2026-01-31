const vscode = require('vscode');
const { rebuildCtags } = require("./ctags");

describe(rebuildCtags, () => {
    it.each([undefined, []])("shows error when no workspace folders are open", (workspaceFolders) => {
        vscode.workspace.workspaceFolders = workspaceFolders;
        const exec = jest.fn();

        rebuildCtags(exec);

        expect(exec).not.toHaveBeenCalled();
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Ctags Companion: No workspace folders open.');
    });

    it.each([
        undefined,
        { document: { uri: { fsPath: "/test/foo" } } },
        { document: { uri: { fsPath: "/file/outside/workspace" } } },
    ])("always runs ctags when there is a single folder in workspace", (activeTextEditor) => {
        vscode.window.activeTextEditor = activeTextEditor;
        vscode.workspace.workspaceFolders = [{ uri: { fsPath: "/test" } }];
        const exec = jest.fn();

        rebuildCtags(exec);

        expect(exec).toHaveBeenCalledTimes(1);
        expect(exec).toHaveBeenLastCalledWith("mock-ctags-command", { cwd: "/test" });
    });

    describe("when there are multiple folders in workspace", () => {
        beforeEach(() => {
            vscode.workspace.workspaceFolders = [{ uri: { fsPath: "/backend" } }, { uri: { fsPath: "/frontend" } }];
        });

        it("shows error when there is no active text editor", () => {
            vscode.window.activeTextEditor = undefined;
            const exec = jest.fn();

            rebuildCtags(exec);

            expect(exec).not.toHaveBeenCalled();
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Ctags Companion: Unable to determine active directory in a multi-root workspace. Please open some file and try again.'
            );
        });

        it("shows error when active text editor is outside of workspace", () => {
            vscode.window.activeTextEditor = { document: { uri: { fsPath: "/file/outside/workspace" } } };
            const exec = jest.fn();

            rebuildCtags(exec);

            expect(exec).not.toHaveBeenCalled();
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Ctags Companion: Unable to determine active workspace directory for the currently open file.'
            ); ``;
        });

        it("runs ctags on the open file's workspace directory", () => {
            vscode.window.activeTextEditor = { document: { uri: { fsPath: "/test/foo" } } };
            const exec = jest.fn();

            rebuildCtags(exec);

            expect(exec).toHaveBeenCalledTimes(1);
            expect(exec).toHaveBeenLastCalledWith("mock-ctags-command", { cwd: "/test" });
        });
    });
});
