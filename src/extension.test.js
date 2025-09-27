const vscode = require("vscode");
const { activate } = require("./extension");

// Mock the helpers
jest.mock("./helpers", () => ({
    getConfiguration: jest.fn(() => ({
        get: jest.fn(() => "ctags -R --fields=+nKz")
    })),
    commandGuard: jest.fn(() => false),
    wrapExec: jest.fn(() => jest.fn(() => Promise.resolve([])))
}));

describe("extension", () => {
    let mockContext;

    beforeEach(() => {
        mockContext = {
            subscriptions: {
                push: jest.fn()
            }
        };
        jest.clearAllMocks();
        // Reset workspace folders to default
        vscode.workspace.workspaceFolders = [{ 
            uri: { fsPath: "/test" }, 
            name: "test" 
        }];
    });

    it("registers the rebuildCtags command", () => {
        activate(mockContext);

        expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
            'ctags-companion.rebuildCtags',
            expect.any(Function)
        );
        expect(mockContext.subscriptions.push).toHaveBeenCalled();
    });

    it("registers language providers", () => {
        activate(mockContext);

        expect(vscode.languages.registerDefinitionProvider).toHaveBeenCalled();
        expect(vscode.languages.registerWorkspaceSymbolProvider).toHaveBeenCalled();
        expect(vscode.languages.registerDocumentSymbolProvider).toHaveBeenCalled();
    });

    it("rebuildCtags command shows error when no workspace folders", async () => {
        // Mock no workspace folders
        vscode.workspace.workspaceFolders = null;
        
        activate(mockContext);
        
        // Get the command function from the registerCommand call
        const commandFunction = vscode.commands.registerCommand.mock.calls[0][1];
        
        await commandFunction();
        
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
            'Ctags Companion: No workspace folder found.'
        );
    });

    it("rebuildCtags command executes successfully for workspace folders", async () => {
        const { wrapExec } = require("./helpers");
        const mockExec = jest.fn(() => Promise.resolve([]));
        wrapExec.mockReturnValue(mockExec);
        
        activate(mockContext);
        
        // Get the command function from the registerCommand call
        const commandFunction = vscode.commands.registerCommand.mock.calls[0][1];
        
        await commandFunction();
        
        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
            'Rebuilding ctags for test...'
        );
        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
            'Ctags rebuilt successfully for test.'
        );
        expect(mockExec).toHaveBeenCalledWith(
            'ctags -R --fields=+nKz',
            { cwd: '/test' }
        );
    });
});