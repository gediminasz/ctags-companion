const vscode = require("vscode");

const { EXTENSION_ID } = require("./constants");

function determineScope(document) {
    return vscode.workspace.workspaceFolders.find(scope => document.uri.fsPath.includes(scope.uri.fsPath));
}

function getConfiguration(scope = null) {
    return vscode.workspace.getConfiguration(EXTENSION_ID, scope);
}

function definitionToSymbolInformation({ symbol, file, line, kind, container }) {
    return new vscode.SymbolInformation(
        symbol,
        toSymbolKind(kind),
        container,
        new vscode.Location(file, new vscode.Position(line, 0))
    );
}

function toSymbolKind(kind) {
    switch (kind) {
        case "class": return vscode.SymbolKind.Class;
        case "const": return vscode.SymbolKind.Constant;
        case "constant": return vscode.SymbolKind.Constant;
        case "constractor": return vscode.SymbolKind.Constractor;
        case "define": return vscode.SymbolKind.Constant;
        case "enum": return vscode.SymbolKind.Enum;
        case "enumConstant": return vscode.SymbolKind.EnumMember;
        case "enumerator": return vscode.SymbolKind.EnumMember;
        case "event": return vscode.SymbolKind.Event;
        case "externvar": return vscode.SymbolKind.Variable;
        case "field": return vscode.SymbolKind.Field;
        case "func": return vscode.SymbolKind.Function;
        case "function": return vscode.SymbolKind.Function;
        case "functionVar": return vscode.SymbolKind.Variable;
        case "globalVar": return vscode.SymbolKind.Variable;
        case "header": return vscode.SymbolKind.File;
        case "ifclass": return vscode.SymbolKind.Interface;
        case "instance": return vscode.SymbolKind.Object;
        case "interface": return vscode.SymbolKind.Module;
        case "key": return vscode.SymbolKind.Key;
        case "library": return vscode.SymbolKind.Package;
        case "local": return vscode.SymbolKind.Variable;
        case "member": return vscode.SymbolKind.Property;
        case "method": return vscode.SymbolKind.Method;
        case "module": return vscode.SymbolKind.Module;
        case "namespace": return vscode.SymbolKind.Namespace;
        case "net": return vscode.SymbolKind.Variable;
        case "nettype": return vscode.SymbolKind.Variable;
        case "package": return vscode.SymbolKind.Package;
        case "parameter": return vscode.SymbolKind.Constant;
        case "port": return vscode.SymbolKind.Variable;
        case "program": return vscode.SymbolKind.Module;
        case "procedure": return vscode.SymbolKind.Function;
        case "property": return vscode.SymbolKind.Property;
        case "protected": return vscode.SymbolKind.Variable;
        case "register": return vscode.SymbolKind.Variable;
        case "RecordField": return vscode.SymbolKind.Property;
        case "signal": return vscode.SymbolKind.Variable;
        case "singletonMethod": return vscode.SymbolKind.Method;
        case "struct": return vscode.SymbolKind.Struct;
        case "submethod": return vscode.SymbolKind.Method;
        case "subprogram": return vscode.SymbolKind.Function;
        case "subroutine": return vscode.SymbolKind.Function;
        case "subroutineDeclaration": return vscode.SymbolKind.Function;
        case "subtype": return vscode.SymbolKind.TypeParameter;
        case "task": return vscode.SymbolKind.Function;
        case "trait": return vscode.SymbolKind.Interface;
        case "type": return vscode.SymbolKind.TypeParameter;
        case "typedef": return vscode.SymbolKind.TypeParameter;
        case "union": return vscode.SymbolKind.Struct;
        case "var": return vscode.SymbolKind.Variable;
        case "variable": return vscode.SymbolKind.Variable;
    }
}

module.exports = { determineScope, getConfiguration, definitionToSymbolInformation };
