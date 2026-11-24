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
 * Fallback for ctags short (single-letter) kind names, e.g. "m" for member.
 * @type {Object.<string, vscode.SymbolKind>}
 */
const LETTER_KINDS = {
    c: vscode.SymbolKind.Class,
    d: vscode.SymbolKind.Constant,
    e: vscode.SymbolKind.EnumMember,
    f: vscode.SymbolKind.Function,
    g: vscode.SymbolKind.Enum,
    h: vscode.SymbolKind.File,
    l: vscode.SymbolKind.Variable,
    m: vscode.SymbolKind.Property,
    n: vscode.SymbolKind.Namespace,
    p: vscode.SymbolKind.Function,
    s: vscode.SymbolKind.Struct,
    t: vscode.SymbolKind.TypeParameter,
    u: vscode.SymbolKind.Struct,
    v: vscode.SymbolKind.Variable,
    x: vscode.SymbolKind.Variable,
    z: vscode.SymbolKind.Constant,
};

/** Scope fields emitted by Universal Ctags for enclosing types. */
const SCOPE_PREFIXES = ["class:", "struct:", "enum:", "union:", "namespace:", "interface:"];

/**
 * A DocumentSymbol with a non-enumerable `_container` field holding the name
 * of the enclosing scope (class/struct/enum/union/namespace/interface).
 * @typedef {vscode.DocumentSymbol & { _container: string }} ScopedDocumentSymbol
 */

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
 * Convert a ctags definition line into a DocumentSymbol.
 *
 * DocumentSymbol (unlike SymbolInformation) has a `children` array, and VS Code's
 * Outline view builds its hierarchy exclusively from `children`. The stock
 * extension returns flat SymbolInformation and only reads the `class:` scope
 * field, so C struct members (which use `struct:`) were shown without any nesting.
 *
 * @param {string} definition
 * @returns {ScopedDocumentSymbol}
 */
function definitionToDocumentSymbol(definition) {
    const [symbol, , ...fields] = definition.split("\t");

    const lineStr = findField(fields, "line:");
    const line = lineStr ? Math.max(0, parseInt(lineStr, 10) - 1) : 0;

    const kindStr = findField(fields, "kind:");
    let kind = vscode.SymbolKind.Variable;
    if (kindStr && Object.hasOwn(SYMBOL_KINDS, kindStr)) {
        kind = SYMBOL_KINDS[kindStr];
    } else if (kindStr && Object.hasOwn(LETTER_KINDS, kindStr)) {
        kind = LETTER_KINDS[kindStr];
    }

    const detail = findField(fields, "typeref:") || "";
    const range = new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, 0));
    const result = /** @type {ScopedDocumentSymbol} */ (new vscode.DocumentSymbol(symbol, detail, kind, range, range));

    const containerField = fields.find(f => SCOPE_PREFIXES.some(p => f.startsWith(p)));
    const container = containerField ? containerField.substring(containerField.indexOf(":") + 1) : "";
    Object.defineProperty(result, "_container", { value: container, enumerable: false });

    return result;
}

/**
 * Build a DocumentSymbol tree from raw ctags output lines.
 *
 * @param {string[]} definitions
 * @returns {vscode.DocumentSymbol[]}
 */
function buildDocumentSymbolTree(definitions) {
    const symbols = definitions
        .filter(d => typeof d === "string" && d.length > 0 && !d.startsWith("!"))
        .map(d => definitionToDocumentSymbol(d));

    const byName = new Map();
    for (const symbol of symbols) {
        if (!byName.has(symbol.name)) byName.set(symbol.name, symbol);
    }

    const roots = [];
    for (const symbol of symbols) {
        const container = symbol._container;
        const parent = container && container !== symbol.name ? byName.get(container) : undefined;
        if (parent && parent !== symbol) {
            parent.children.push(symbol);
        } else {
            roots.push(symbol);
        }
    }

    /** @param {ScopedDocumentSymbol[]} arr */
    const sortTree = arr => {
        arr.sort((a, b) => a.selectionRange.start.line - b.selectionRange.start.line);
        arr.forEach(s => sortTree(/** @type {ScopedDocumentSymbol[]} */ (s.children)));
    };
    sortTree(roots);
    return roots;
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

module.exports = {
    getConfiguration,
    commandGuard,
    definitionToSymbolInformation,
    definitionToDocumentSymbol,
    buildDocumentSymbolTree,
    wrapExec,
    tryExec,
};
