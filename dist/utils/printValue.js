"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strip_indent_1 = __importDefault(require("strip-indent"));
function deindent(code) {
    const firstNewLine = code.indexOf('\n');
    return (code.slice(0, firstNewLine + 1) +
        // remove indentation from all lines except first.
        (0, strip_indent_1.default)(code.slice(firstNewLine + 1)));
}
/**
 * Prints the given path without leading or trailing comments.
 */
function printValue(path) {
    let source = path.getSource();
    // variable declarations and interface/type/class members might end with one of these
    if (source.endsWith(',') || source.endsWith(';')) {
        source = source.slice(0, -1);
    }
    return deindent(source);
}
exports.default = printValue;
