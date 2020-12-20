const SymbolKind = {
    Function: 11
};

const _scope = { uri: { fsPath: "/test" } };

const workspace = {
    workspaceFolders: [_scope],

    getConfiguration: () => ({
        get: (key) => {
            switch (key) {
                case "path":
                    return "path/to/ctags";
            }
        }
    }),

    asRelativePath: ({ fsPath }) => {
        return fsPath.replace(/^(\/test\/)/, "");
    }
};

console.assert(workspace.asRelativePath({ fsPath: "/test/foo" }) == "foo");
console.assert(workspace.asRelativePath({ fsPath: "/elsewhere/bar" }) == "/elsewhere/bar");

function Position(line, character) {
    return { line, character };
}

function Location(uri, rangeOrPosition) {
    return { uri, rangeOrPosition };
}

function SymbolInformation(name, kind, containerName, location) {
    return { name, kind, containerName, location };
}

module.exports = { SymbolKind, workspace, Position, Location, SymbolInformation };
