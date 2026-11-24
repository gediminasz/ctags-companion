const path = require('path');

// Mirrors vscode.SymbolKind (https://code.visualstudio.com/api/references/vscode-api#SymbolKind)
const SymbolKind = {
    File: 0,
    Module: 1,
    Namespace: 2,
    Package: 3,
    Class: 4,
    Method: 5,
    Property: 6,
    Field: 7,
    Constructor: 8,
    Enum: 9,
    Interface: 10,
    Function: 11,
    Variable: 12,
    Constant: 13,
    String: 14,
    Number: 15,
    Boolean: 16,
    Array: 17,
    Object: 18,
    Key: 19,
    Null: 20,
    EnumMember: 21,
    Struct: 22,
    Event: 23,
    Operator: 24,
    TypeParameter: 25,
};

const _scope = { uri: { fsPath: "/test" } };

const workspace = {
    workspaceFolders: [_scope],

    getConfiguration: () => ({
        get: (key) => {
            switch (key) {
                case "command":
                    return "mock-ctags-command";
                default:
                    return "mock-setting-value";
            }
        }
    }),

    asRelativePath: ({ fsPath }) => {
        return fsPath.replace(/^(\/test\/)/, "");
    },

    getWorkspaceFolder: (_uri) => {
        return workspace.workspaceFolders.find(f => _uri.fsPath.startsWith(f.uri.fsPath));
    },
};

console.assert(workspace.asRelativePath({ fsPath: "/test/foo" }) == "foo");
console.assert(workspace.asRelativePath({ fsPath: "/elsewhere/bar" }) == "/elsewhere/bar");

const mockOutputChannel = {
    appendLine: jest.fn(),
};

const window = {
    showErrorMessage: jest.fn(),
    createOutputChannel: () => mockOutputChannel
};

function Position(line, character) {
    return { line, character };
}

function Range(start, end) {
    return { start, end };
}

function Location(uri, rangeOrPosition) {
    return { uri, rangeOrPosition };
}

function SymbolInformation(name, kind, containerName, location) {
    return { name, kind, containerName, location };
}

function DocumentSymbol(name, detail, kind, range, selectionRange) {
    return { name, detail, kind, range, selectionRange, children: [] };
}

const Uri = {
    parse: (path) => path,
    // Use POSIX separators so paths are stable on every platform, matching VS Code's Uri behavior.
    joinPath: (left, right) => path.posix.join(left.fsPath, right)
};

module.exports = {
    DocumentSymbol,
    Location,
    Position,
    Range,
    SymbolInformation,
    SymbolKind,
    Uri,
    window,
    workspace,
};
