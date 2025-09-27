const path = require('path');

const SymbolKind = {
    Class: 4,
    Property: 6,
    Function: 11,
    Variable: 12,
};

const _scope = { uri: { fsPath: "/test" } };

const workspace = {
    workspaceFolders: [_scope],

    getConfiguration: () => ({
        get: (key) => {
            switch (key) {
                default:
                    return "MOCK_SETTING_VALUE";
            }
        }
    }),

    asRelativePath: ({ fsPath }) => {
        return fsPath.replace(/^(\/test\/)/, "");
    }
};

console.assert(workspace.asRelativePath({ fsPath: "/test/foo" }) == "foo");
console.assert(workspace.asRelativePath({ fsPath: "/elsewhere/bar" }) == "/elsewhere/bar");

const mockOutputChannel = {
    appendLine: jest.fn(),
};

const window = {
    showErrorMessage: jest.fn(),
    showInformationMessage: jest.fn(),
    createOutputChannel: () => mockOutputChannel
};

const commands = {
    registerCommand: jest.fn(() => ({ dispose: jest.fn() }))
};

const languages = {
    registerDefinitionProvider: jest.fn(() => ({ dispose: jest.fn() })),
    registerWorkspaceSymbolProvider: jest.fn(() => ({ dispose: jest.fn() })),
    registerDocumentSymbolProvider: jest.fn(() => ({ dispose: jest.fn() }))
};

function Position(line, character) {
    return { line, character };
}

function Location(uri, rangeOrPosition) {
    return { uri, rangeOrPosition };
}

function SymbolInformation(name, kind, containerName, location) {
    return { name, kind, containerName, location };
}

const Uri = {
    parse: (path) => path,
    joinPath: (left, right) => path.join(left.fsPath, right)
};

module.exports = {
    Location,
    Position,
    SymbolInformation,
    SymbolKind,
    Uri,
    commands,
    languages,
    window,
    workspace,
};
