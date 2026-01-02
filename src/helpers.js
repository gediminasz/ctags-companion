const vscode = require("vscode");
const { exec } = require('child_process');
const { promisify } = require('util');
const { isAbsolute } = require('path');

const { EXTENSION_ID, EXTENSION_NAME } = require("./constants");

/**
 * @param {vscode.WorkspaceFolder | undefined} scope
 * @returns {vscode.WorkspaceConfiguration}
 */
function getConfiguration(scope = undefined) {
    return vscode.workspace.getConfiguration(EXTENSION_ID, scope);
}

/**
 * @param {string} command
 * @returns {boolean}
 */
function commandGuard(command) {
    if (typeof command !== 'string' || command.trim() === '') {
        vscode.window.showErrorMessage(
            `${EXTENSION_NAME}: The "Command" preference is not set. Please check your configuration.`
        );
        return true;
    }

    return false;
}

/**
 * @type {Object.<string, vscode.SymbolKind>}
 */
const SYMBOL_KINDS = {
    class: vscode.SymbolKind.Class,
    const: vscode.SymbolKind.Constant,
    constant: vscode.SymbolKind.Constant,
    constructor: vscode.SymbolKind.Constructor,
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

/**
 * @param {string} definition
 * @param {vscode.WorkspaceFolder | undefined} scope
 * @returns {vscode.SymbolInformation}
 */
function definitionToSymbolInformation(definition, scope = undefined) {
    const [symbol, path, ...fields] = definition.split("\t");

    const file = isAbsolute(path) || scope === undefined
        ? vscode.Uri.parse(path)
        : vscode.Uri.joinPath(scope.uri, path);

    const lineStr = findField(fields, "line:");
    const line = lineStr ? parseInt(lineStr, 10) - 1 : 0;

    const kindStr = findField(fields, "kind:");
    const kind = (kindStr === undefined || !Object.hasOwn(SYMBOL_KINDS, kindStr))
        ? vscode.SymbolKind.Variable
        : SYMBOL_KINDS[kindStr];

    const container = findField(fields, "class:") || "";

    const location = new vscode.Location(file, new vscode.Position(line, 0));

    return new vscode.SymbolInformation(symbol, kind, container, location);
}

/**
 * @param {string[]} tags
 * @param {string} prefix
 * @returns {string | undefined}
 */
function findField(tags, prefix) {
    const tag = tags.find(value => value.startsWith(prefix));
    return tag && tag.substring(prefix.length);
}

const outputChannel = vscode.window.createOutputChannel(EXTENSION_NAME);

/**
 * @param {function} exec
 * @param {string} platform
 * @returns {function(string, object): Promise<string[]>}
 */
function wrapExec(exec, platform = process.platform) {
    return async (command, options) => {
        try {
            if (platform === "win32") {
                // Use PowerShell on Windows because Command Prompt does not support single quotes
                options = { ...options, shell: "powershell.exe" };
            }

            outputChannel.appendLine(`${command} ${JSON.stringify(options)}`);

            const { stdout } = await exec(command, options);
            const output = stdout.trim();
            return output ? output.split('\n') : [];
        } catch (e) {
            if (e instanceof Error) {
                outputChannel.appendLine(e.message);
                return [];
            }
            throw e;
        }
    };
}

const tryExec = wrapExec(promisify(exec));

module.exports = { getConfiguration, commandGuard, definitionToSymbolInformation, wrapExec, tryExec };
