"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const printValue_1 = __importDefault(require("./printValue"));
/**
 * If node is an Identifier, it returns its name. If it is a literal, it returns
 * its value.
 */
function getNameOrValue(path) {
    if (path.isIdentifier()) {
        return path.node.name;
    }
    else if (path.isQualifiedTypeIdentifier() || path.isTSQualifiedName()) {
        return (0, printValue_1.default)(path);
    }
    else if (path.isStringLiteral() ||
        path.isNumericLiteral() ||
        path.isBooleanLiteral()) {
        return path.node.value;
    }
    else if (path.isRegExpLiteral()) {
        return path.node.pattern;
    }
    else if (path.isNullLiteral()) {
        return null;
    }
    throw new TypeError(`Argument must be Identifier, Literal, QualifiedTypeIdentifier or TSQualifiedName. Received '${path.node.type}'`);
}
exports.default = getNameOrValue;
