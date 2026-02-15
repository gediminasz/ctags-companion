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
 * @typedef {object} ParsedDefinition
 * @property {string} symbol
 * @property {string} path
 * @property {number | null} line
 * @property {string | null} pattern
 * @property {string[]} fields
 */

/**
 * @param {string} definition
 * @returns {ParsedDefinition}
 */
function parseDefinitionLine(definition) {
    // Parses: name TAB path TAB ...
    const basicMatch = /^([^\t]*)\t([^\t]*)\t/.exec(definition);
    if (basicMatch === null) {
        // Very malformed line, contains zero or one tab
        const [symbol, path] = definition.split("\t");
        return {
            symbol,
            path: path ? path : "",
            line: null,
            pattern: null,
            fields: []
        };
    }

    const [basicAll, symbol, path] = basicMatch;
    const rest = definition.slice(basicAll.length);

    // Parsing the rest of the line as follows:
    //      https://docs.ctags.io/en/latest/man/ctags-client-tools.7.html#parse-readtags-output

    /** @type {(s: string) => string[]} */
    const splitFields = (s) => s === "" ? [] : s.split("\t");

    // Parses: Number only, no pattern, possibly with `;"` and fields after
    const noPatternMatch = /^(\d+)(?:;"\t?|$)/.exec(rest);
    if (noPatternMatch !== null) {
        const [noPatternAll, num] = noPatternMatch;
        const fields = rest.slice(noPatternAll.length);
        return {
            symbol,
            path,
            line: Number(num),
            pattern: null,
            fields: splitFields(fields)
        };
    }

    // Parses: Pattern or number + pattern, possibly with `;"` and fields after
    //
    // - Number, if it exists, is terminated by a semicolon (`;`).
    // - A pattern could be like `/this/` or `?this?`. The unholy middle of this
    //   regex parses a pattern with possibly escaped delimiters inside, like
    //   `/foo\/bar/`, `?foo\?bar?`, `/foo\\\/bar/`, while capturing the actual
    //   pattern part.
    const patternMatch = /^(?:(\d+);)?(?:\/((?:[^\\/]|\\.)+)\/|\?((?:[^\\?]|\\.)+)\?)(?:;"\t?|$)/.exec(rest);
    if (patternMatch === null) {
        // Probably malformed fields, try our best to still parse the fields
        return {
            symbol,
            path,
            line: null,
            pattern: null,
            fields: splitFields(rest)
        };
    }

    const [patternAll, num, fwdPattern, backPattern] = patternMatch;
    const fields = rest.slice(patternAll.length);
    const pattern = fwdPattern ? fwdPattern : backPattern;
    return {
        symbol,
        path,
        line: num ? Number(num) : null,
        pattern,
        fields: splitFields(fields)
    };
}

/**
 * @param {string} definition
 * @param {vscode.WorkspaceFolder | undefined} scope
 * @returns {vscode.SymbolInformation & { _pattern?: string }}
 */
function definitionToSymbolInformation(definition, scope = undefined) {
    const { symbol, path, line, pattern, fields } = parseDefinitionLine(definition);

    const file = isAbsolute(path) || scope === undefined
        ? vscode.Uri.parse(path)
        : vscode.Uri.joinPath(scope.uri, path);

    const lineStr = findField(fields, "line:");
    const lineNum =
        line !== null
            ? line
            : (lineStr ? parseInt(lineStr, 10) - 1 : 0);

    const kindStr = findField(fields, "kind:");
    const kind = (kindStr === undefined || !Object.hasOwn(SYMBOL_KINDS, kindStr))
        ? vscode.SymbolKind.Variable
        : SYMBOL_KINDS[kindStr];

    const container = findField(fields, "class:") || "";

    const location = new vscode.Location(file, new vscode.Position(lineNum, 0));

    /** @type {vscode.SymbolInformation & { _pattern?: string }} */
    const info = new vscode.SymbolInformation(symbol, kind, container, location);

    if (pattern !== null)
        info._pattern = pattern;

    return info;
}

/**
 * @typedef {object} FileContents
 * @property {number} totalLines
 * @property {(i: number) => string} getLine
 */

/**
 * @param {vscode.Uri} uri
 * @returns {Promise<FileContents | null>}
 */
async function findDocumentOrReadFile(uri) {
    /** @type {(a: vscode.Uri, b: vscode.Uri) => boolean} */
    const uriEqual = (a, b) => a.toString() == b.toString();
    const doc = vscode.workspace.textDocuments.find(doc => uriEqual(doc.uri, uri));
    if (doc !== undefined) {
        return {
            totalLines: doc.lineCount,
            getLine: (i) => doc.lineAt(i).text
        };
    }

    let data;

    try {
        data = await vscode.workspace.fs.readFile(uri);
    } catch (e) {
        return null;
    }

    const decoded = new TextDecoder().decode(data);
    const lines = decoded.split('\n');

    return {
        totalLines: lines.length,
        getLine: (i) => lines[i]
    };
}

/**
 * @param {string} string
 * @returns {RegExp | null}
 */
function tryMakeRegexp(string) {
    try {
        return RegExp(string);
    } catch {
        return null;
    }
}

/**
 * @param {vscode.SymbolInformation & { _pattern?: string }} symbol
 * @returns {Promise<vscode.SymbolInformation>}
 */
async function resolveSymbolInformation(symbol) {
    const scope = vscode.workspace.getWorkspaceFolder(symbol.location.uri);
    const shouldResolve = getConfiguration(scope).get("usePatternField");
    if (!shouldResolve)
        return symbol;

    const lines = await findDocumentOrReadFile(symbol.location.uri);

    if (lines === null)
        return symbol; // Fail gracefully on file error here

    const { totalLines, getLine } = lines;

    const origLineNum = symbol.location.range.start.line;

    // If old line number is out of range, it could just mean that many lines were deleted.
    // In this case, search from the last line of the file.
    const lineNum = origLineNum >= totalLines ? totalLines - 1 : origLineNum;

    /**
     * Search around the line number found in the tags file, nearest first
     *
     * See: https://docs.ctags.io/en/latest/man/ctags-client-tools.7.html#make-use-of-the-pattern-field
     *
     * @param {(s: string) => number | null} check
     * @returns {{line: number, col: number} | null}
     */
    function doSearch(check) {
        for (let offset = 0; lineNum - offset >= 0 || lineNum + offset < totalLines; offset++) {
            const tries = [lineNum - offset, lineNum + offset].filter(x => x >= 0 && x < totalLines);
            for (const num of tries) {
                const col = check(getLine(num));
                if (col !== null)
                    return {
                        line: num,
                        col
                    };
            }
        }

        return null;
    }

    let found = null;

    const pattern = symbol._pattern;
    if (pattern !== undefined) {
        // Try searching the specified pattern first

        // XXX: Somehow actually parse a "nomagic" pattern here
        const procPattern = pattern.replaceAll(/[^\w\s$^.\\]/g, (s) => '\\' + s);

        const regex = tryMakeRegexp(procPattern);

        if (regex !== null)
            found = doSearch((s) => {
                const match = regex.exec(s);
                if (match === null) return null;
                return match.index;
            });
    }

    if (found === null) {
        // Try again, but this time only search for the name itself
        found = doSearch((s) => {
            const i = s.indexOf(symbol.name);
            return i === -1 ? null : i;
        });
    }

    if (found !== null) {
        // We have new location information
        const location = new vscode.Location(symbol.location.uri, new vscode.Position(found.line, found.col));
        const newSymbol = new vscode.SymbolInformation(symbol.name, symbol.kind, symbol.containerName, location);
        return newSymbol;
    }
    return symbol;
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
    resolveSymbolInformation,
    wrapExec,
    tryExec
};
