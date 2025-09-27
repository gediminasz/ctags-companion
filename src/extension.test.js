const vscode = require("vscode");
const { activate } = require("./extension");

describe("extension", () => {
    let mockContext;

    beforeEach(() => {
        mockContext = {
            subscriptions: {
                push: jest.fn()
            }
        };
        jest.clearAllMocks();
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
});