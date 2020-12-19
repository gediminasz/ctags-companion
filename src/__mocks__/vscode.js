const _scope = { uri: { fsPath: "/test" } };

const workspace = {
    workspaceFolders: {
        find: () => _scope
    },
    getConfiguration: () => ({
        get: (key) => {
            switch (key) {
                case "path":
                    return "path/to/ctags";
            }
        }
    })
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


module.exports = { workspace, Position, Location, SymbolInformation };
