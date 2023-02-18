const vscode = require("vscode");

const { EXTENSION_ID, EXTENSION_NAME } = require("./constants");

function determineScope(document) {
    return vscode.workspace.workspaceFolders.find(scope => document.uri.fsPath.includes(scope.uri.fsPath));
}

function getConfiguration(scope = null) {
    return vscode.workspace.getConfiguration(EXTENSION_ID, scope);
}

function commandGuard(command) {
    if (typeof command !== 'string' || command.trim() === '') {
        vscode.window.showErrorMessage(
            `${EXTENSION_NAME}: The "Command" preference is not set. Please check your configuration.`
        );
        return true;
    }

    return false;
}

const SYMBOL_KINDS = {
    class: vscode.SymbolKind.Class,
    const: vscode.SymbolKind.Constant,
    constant: vscode.SymbolKind.Constant,
    constractor: vscode.SymbolKind.Constractor,
    define: vscode.SymbolKind.Constant,
    enum: vscode.SymbolKind.Enum,
    enumConstant: vscode.SymbolKind.EnumMember,
    enumerator: vscode.SymbolKind.EnumMember,
    event: vscode.SymbolKind.Event,
    externvar: vscode.SymbolKind.Variable,
    field: vscode.SymbolKind.Field,
    func: vscode.SymbolKind.Function,
    function: vscode.SymbolKind.Function,
    functionVar: vscode.SymbolKind.Variable,
    globalVar: vscode.SymbolKind.Variable,
    header: vscode.SymbolKind.File,
    ifclass: vscode.SymbolKind.Interface,
    instance: vscode.SymbolKind.Object,
    interface: vscode.SymbolKind.Module,
    key: vscode.SymbolKind.Key,
    library: vscode.SymbolKind.Package,
    local: vscode.SymbolKind.Variable,
    member: vscode.SymbolKind.Property,
    method: vscode.SymbolKind.Method,
    module: vscode.SymbolKind.Module,
    namespace: vscode.SymbolKind.Namespace,
    net: vscode.SymbolKind.Variable,
    nettype: vscode.SymbolKind.Variable,
    package: vscode.SymbolKind.Package,
    parameter: vscode.SymbolKind.Constant,
    port: vscode.SymbolKind.Variable,
    program: vscode.SymbolKind.Module,
    procedure: vscode.SymbolKind.Function,
    property: vscode.SymbolKind.Property,
    protected: vscode.SymbolKind.Variable,
    register: vscode.SymbolKind.Variable,
    RecordField: vscode.SymbolKind.Property,
    signal: vscode.SymbolKind.Variable,
    singletonMethod: vscode.SymbolKind.Method,
    struct: vscode.SymbolKind.Struct,
    submethod: vscode.SymbolKind.Method,
    subprogram: vscode.SymbolKind.Function,
    subroutine: vscode.SymbolKind.Function,
    subroutineDeclaration: vscode.SymbolKind.Function,
    subtype: vscode.SymbolKind.TypeParameter,
    task: vscode.SymbolKind.Function,
    trait: vscode.SymbolKind.Interface,
    type: vscode.SymbolKind.TypeParameter,
    typedef: vscode.SymbolKind.TypeParameter,
    union: vscode.SymbolKind.Struct,
    var: vscode.SymbolKind.Variable,
    variable: vscode.SymbolKind.Variable,
};

function definitionToSymbolInformation(definition, scope) {
    const [symbol, path, ...fields] = definition.split("\t");

    const file = path.startsWith('/') ? vscode.Uri.parse(path) : vscode.Uri.joinPath(scope.uri, path);

    const lineStr = findField(fields, "line:");
    const line = lineStr ? parseInt(lineStr, 10) - 1 : 0;
    const kind = findField(fields, "kind:");
    const container = findField(fields, "class:");

    return new vscode.SymbolInformation(
        symbol,
        kind && SYMBOL_KINDS[kind],
        container,
        new vscode.Location(file, new vscode.Position(line, 0))
    );
}

function findField(tags, prefix) {
    const tag = tags.find(value => value.startsWith(prefix));
    return tag && tag.substring(prefix.length);
}

function wrapExec(exec) {
    return async (...args) => {
        try {
            const { stdout } = await exec(...args);
            const output = stdout.trim();
            return output ? output.split('\n') : [];
        } catch ({ stderr }) {
            vscode.window.showErrorMessage(`${EXTENSION_NAME}: ${stderr}`);
            return [];
        }
    };
}

module.exports = { determineScope, getConfiguration, commandGuard, definitionToSymbolInformation, wrapExec };
