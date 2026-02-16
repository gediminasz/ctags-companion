const path = require('path');

const SymbolKind = {
    Class: 4,
    Property: 6,
    Function: 11,
    Variable: 12,
};

class Uri {
    constructor(path) {
        this.fsPath = path;
    }
    toString() {
        return "file://" + this.fsPath;
    }
    static parse(path) {
        return new Uri(path);
    }
    static joinPath(left, right) {
        return Uri.parse(path.join(left.fsPath, right));
    }
}

const _scope = { uri: Uri.parse("/test") };

const workspace = {
    workspaceFolders: [_scope],
    textDocuments: [
        {
            uri: Uri.parse("/test/dirty_file.py"),
            lineCount: 3,
            lineAt: (i) => {
                const lines = [
                    `# Some extra line in this file`,
                    `# This open document isn't saved yet`,
                    `foo = 3`,
                    ``
                ];
                return { text: lines[i] };
            }
        }
    ],

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
        if (_uri.fsPath.startsWith(_scope.uri.fsPath)) {
            return _scope;
        }
    },

    fs: {
        readFile: (uri) => {
            const FILES = {
                "/patterns/matching.py": [
                    `class Buzz:`,
                    `    fizz = "fizz"`,
                    ``
                ].join('\n'),
                "/patterns/dollar.py": [
                    `class Buzz:`,
                    `    dollar = "$"`,
                    ``
                ].join('\n'),
                "/patterns/only_symbol_match.py": [
                    `foo = 3`,
                    `bar = 4`,
                    `fizz = 5`,
                    ``
                ].join('\n'),
                "/test/dirty_file.py": [
                    `foo = 3`,
                    ``
                ].join('\n'),
            };

            if (uri.fsPath in FILES)
                return new TextEncoder().encode(FILES[uri.fsPath]);
            else
                throw new FileSystemError();
        }
    }
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

function Location(uri, position) {
    return { uri, range: { start: position, end: position } };
}

function SymbolInformation(name, kind, containerName, location) {
    return { name, kind, containerName, location };
}

function FileSystemError() {
}

module.exports = {
    Location,
    Position,
    SymbolInformation,
    FileSystemError,
    SymbolKind,
    Uri,
    window,
    workspace,
};
